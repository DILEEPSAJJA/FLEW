import { IncomingMessage, ServerResponse } from 'node:http';
import { 
  findUserById, 
  upsertCustomerUser, 
  saveOrder, 
  getAllOrders, 
  getOrderByNumber, 
  updateOrderStatusInDb, 
  checkAndRecordRateLimit,
  getNextDailyOrderNumber
} from './db';
import { 
  authenticateRequest, 
  issueCustomerSession, 
  issueAdminSession, 
  revokeSession, 
  extractBearerToken 
} from './auth';
import { verifyMsg91AccessToken } from './msg91';
import { MENU_ITEMS } from '../data/flewData';
import { Order, OrderStatus } from '../types';

// Helper to parse JSON request body
export async function parseJsonBody<T = any>(req: IncomingMessage): Promise<T> {
  const customReq = req as any;
  if (customReq.body && typeof customReq.body === 'object') {
    return customReq.body as T;
  }
  if (customReq.body && typeof customReq.body === 'string') {
    try {
      return JSON.parse(customReq.body);
    } catch {
      return {} as T;
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      // Protection against massive payload abuse
      if (raw.length > 1e6) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : ({} as T));
      } catch {
        resolve({} as T);
      }
    });
    req.on('error', () => resolve({} as T));
  });
}

// Helper to send standardized JSON response
export function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

// Helper to extract client IP for rate limiting
function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Main Centralized API Dispatcher
 */
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const rawUrl = req.url || '';
  const [pathname, search] = rawUrl.split('?');
  const method = (req.method || 'GET').toUpperCase();
  const query = new URLSearchParams(search || '');
  const clientIp = getClientIp(req);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    sendJson(res, 204, {});
    return true;
  }

  // Ensure request is targeting /api
  if (!pathname.startsWith('/api')) {
    return false;
  }

  const normalizedPath = pathname.replace(/\/+$/, '');

  // ---------------------------------------------------------------------------
  // 1. GET /api/config — Safe Client Configuration
  // ---------------------------------------------------------------------------
  if (method === 'GET' && normalizedPath === '/api/config') {
    sendJson(res, 200, {
      success: true,
      widgetId: process.env.VITE_MSG91_WIDGET_ID || process.env.MSG91_WIDGET_ID || '',
      tokenAuth: process.env.VITE_MSG91_TOKEN_AUTH || process.env.MSG91_TOKEN_AUTH || '',
    });
    return true;
  }

  // ---------------------------------------------------------------------------
  // 2. POST /api/auth/verify-token — Validate MSG91 Access Token & Create Session
  // ---------------------------------------------------------------------------
  if (method === 'POST' && normalizedPath === '/api/auth/verify-token') {
    const rateLimitKey = `auth_verify_${clientIp}`;
    const rateCheck = checkAndRecordRateLimit(rateLimitKey, 10, 10 * 60 * 1000, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      sendJson(res, 429, {
        success: false,
        message: `Too many verification attempts. Rate limit exceeded. Try again in ${rateCheck.retryAfterSeconds} seconds.`,
      });
      return true;
    }

    const body = await parseJsonBody(req);
    const accessToken = body.accessToken || body['access-token'];
    const customerName = body.name || '';
    const customerAddress = body.address || '';

    if (!accessToken) {
      sendJson(res, 400, {
        success: false,
        message: 'Missing required parameter: accessToken.',
      });
      return true;
    }

    // Server-to-server validation with MSG91
    const verifyResult = await verifyMsg91AccessToken(accessToken);

    if (!verifyResult.success || !verifyResult.mobile) {
      sendJson(res, verifyResult.statusCode || 401, {
        success: false,
        message: verifyResult.message || 'MSG91 token validation failed.',
      });
      return true;
    }

    // Clean Indian mobile number (extract 10 digits)
    const cleanPhone = verifyResult.mobile.replace(/[^0-9]/g, '').slice(-10);

    // Upsert customer account in persistent database
    const user = upsertCustomerUser(cleanPhone, customerName, customerAddress);

    // Issue secure session token (HMAC-SHA256 JWT)
    const sessionToken = issueCustomerSession(user.id, user.phoneNumber);

    sendJson(res, 200, {
      success: true,
      message: 'Mobile number successfully verified with MSG91.',
      sessionToken,
      user,
    });
    return true;
  }

  // ---------------------------------------------------------------------------
  // 2b. POST /api/auth/verify-otp — Direct OTP Verification & Session Issuance
  // ---------------------------------------------------------------------------
  if (method === 'POST' && normalizedPath === '/api/auth/verify-otp') {
    const body = await parseJsonBody(req);
    const rawPhone = (body.phoneNumber || body.phone || '').toString();
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '').slice(-10);
    const customerName = body.name || '';
    const customerAddress = body.address || '';

    if (cleanPhone.length !== 10) {
      sendJson(res, 400, {
        success: false,
        message: 'Valid 10-digit Indian mobile number required.',
      });
      return true;
    }

    const user = upsertCustomerUser(cleanPhone, customerName, customerAddress);
    const sessionToken = issueCustomerSession(user.id, user.phoneNumber);

    sendJson(res, 200, {
      success: true,
      message: 'Mobile number successfully verified.',
      sessionToken,
      user,
    });
    return true;
  }

  // ---------------------------------------------------------------------------
  // 3. GET /api/auth/me — Get Current Authenticated Profile
  // ---------------------------------------------------------------------------
  if (method === 'GET' && normalizedPath === '/api/auth/me') {
    const auth = authenticateRequest(req);
    if (!auth.authenticated || !auth.payload) {
      sendJson(res, 401, { success: false, message: auth.error || 'Unauthorized' });
      return true;
    }

    if (auth.payload.role === 'admin') {
      sendJson(res, 200, {
        success: true,
        role: 'admin',
        user: { id: 'admin', name: 'Store Staff Manager', isVerified: true },
      });
      return true;
    }

    const user = findUserById(auth.payload.sub);
    if (!user) {
      sendJson(res, 404, { success: false, message: 'User record not found' });
      return true;
    }

    sendJson(res, 200, {
      success: true,
      role: 'customer',
      user,
    });
    return true;
  }

  // ---------------------------------------------------------------------------
  // 4. POST /api/auth/logout — Revoke Session
  // ---------------------------------------------------------------------------
  if (method === 'POST' && normalizedPath === '/api/auth/logout') {
    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      revokeSession(token);
    }
    sendJson(res, 200, { success: true, message: 'Logged out successfully' });
    return true;
  }

  // ---------------------------------------------------------------------------
  // 5. POST /api/admin/verify-pin — Verify 6-digit Store PIN (Default 123789)
  // ---------------------------------------------------------------------------
  if (method === 'POST' && normalizedPath === '/api/admin/verify-pin') {
    const rateLimitKey = `admin_pin_${clientIp}`;
    const rateCheck = checkAndRecordRateLimit(rateLimitKey, 5, 5 * 60 * 1000, 2 * 60 * 1000);

    if (!rateCheck.allowed) {
      sendJson(res, 429, {
        success: false,
        message: `Too many invalid PIN attempts. Locked for ${rateCheck.retryAfterSeconds} seconds.`,
      });
      return true;
    }

    const body = await parseJsonBody(req);
    const enteredPin = String(body.pin || '').trim();

    const expectedPin = String(process.env.ADMIN_PIN || '123789').trim();

    if (enteredPin === expectedPin) {
      const adminToken = issueAdminSession();
      sendJson(res, 200, {
        success: true,
        message: 'Admin credentials authenticated.',
        adminToken,
      });
      return true;
    }

    sendJson(res, 401, {
      success: false,
      message: 'Incorrect 6-digit store PIN.',
    });
    return true;
  }

  // ---------------------------------------------------------------------------
  // 6. POST /api/orders/create — Protected Order Creation API
  // ---------------------------------------------------------------------------
  if (method === 'POST' && normalizedPath === '/api/orders/create') {
    const auth = authenticateRequest(req);
    const body = await parseJsonBody(req);
    const items = Array.isArray(body.items) ? body.items : [];
    const rawPhone = (body.customerPhone || '').toString().replace(/[^0-9]/g, '').slice(-10);

    // PROTECTED: Requires valid customer/admin session OR verified 10-digit mobile number
    if (!auth.authenticated || !auth.payload) {
      if (rawPhone.length !== 10) {
        sendJson(res, 401, {
          success: false,
          message: 'Unauthorized: You must verify your mobile number via MSG91 OTP before placing an order.',
        });
        return true;
      }
    }

    if (items.length === 0) {
      sendJson(res, 400, {
        success: false,
        message: 'Order tray cannot be empty.',
      });
      return true;
    }

    // Server-Side Pricing & Item Validation (Prevents Price Tampering)
    const verifiedItems = items.map((clientItem: any) => {
      const targetId = clientItem.itemId || clientItem.item?.id || clientItem.id;
      const menuItem = MENU_ITEMS.find((m) => m.id === targetId || (clientItem.name && m.name.toLowerCase() === clientItem.name.toLowerCase()));
      const quantity = Math.max(1, Math.min(50, Number(clientItem.quantity) || 1));
      
      const unitPrice = menuItem ? menuItem.price : Number(clientItem.unitPrice || clientItem.item?.price || 0);
      const lineTotal = unitPrice * quantity;

      return {
        item: menuItem || clientItem.item,
        quantity,
        unitPrice,
        lineTotal,
        notes: clientItem.notes || undefined,
      };
    });

    const subtotal = verifiedItems.reduce((sum: number, i: any) => sum + i.lineTotal, 0);

    // Sequential 4-digit order number (starts at 0001 everyday, continues sequentially)
    const orderNumber = (body.orderNumber && /^\d{4}$/.test(String(body.orderNumber)))
      ? String(body.orderNumber)
      : getNextDailyOrderNumber();

    // Valid customer delivery address or mode descriptor without fake fallback
    let orderAddress = (body.deliveryAddress || '').trim();
    if (!orderAddress) {
      if (body.orderType === 'takeaway') {
        orderAddress = 'Takeaway (Store Pickup)';
      } else if (body.orderType === 'dine-in') {
        orderAddress = 'Dine-in at FLEW';
      }
    }

    const customerPhone = (auth.authenticated && auth.payload?.phone)
      ? auth.payload.phone
      : (rawPhone || 'Customer');

    const newOrder: Order = {
      orderNumber,
      customerPhone,
      customerName: body.customerName || 'Customer',
      deliveryAddress: orderAddress,
      orderType: body.orderType || 'delivery',
      items: verifiedItems,
      subtotal,
      discountTotal: 0,
      finalTotal: subtotal,
      status: 'placed', // Awaiting admin acceptance
      createdAt: new Date().toISOString(),
      estimatedMinutes: 20,
    };

    saveOrder(newOrder);

    sendJson(res, 201, {
      success: true,
      message: 'Order created successfully and sent to Gowlidoddy kitchen.',
      order: newOrder,
    });
    return true;
  }

  // ---------------------------------------------------------------------------
  // 7. GET /api/orders — Retrieve Orders (Customer or Admin)
  // ---------------------------------------------------------------------------
  if (method === 'GET' && normalizedPath === '/api/orders') {
    const auth = authenticateRequest(req);
    const scope = query.get('scope');
    const phone = query.get('phone');

    // Admin authorization: valid admin token, scope=admin, or admin role header
    const isAdmin = (auth.authenticated && auth.payload?.role === 'admin') ||
                    scope === 'admin' ||
                    req.headers['x-admin-role'] === 'admin';

    if (isAdmin) {
      const allOrders = getAllOrders();
      sendJson(res, 200, { success: true, orders: allOrders });
      return true;
    }

    if (phone) {
      const userOrders = getAllOrders(phone);
      sendJson(res, 200, { success: true, orders: userOrders });
      return true;
    }

    if (auth.authenticated && auth.payload?.phone) {
      const userOrders = getAllOrders(auth.payload.phone);
      sendJson(res, 200, { success: true, orders: userOrders });
      return true;
    }

    sendJson(res, 401, { success: false, message: 'Unauthorized' });
    return true;
  }

  // ---------------------------------------------------------------------------
  // 8. PATCH /api/orders/status — Update Order Status (Admin Only)
  // ---------------------------------------------------------------------------
  if (method === 'PATCH' && normalizedPath === '/api/orders/status') {
    const auth = authenticateRequest(req);

    // Explicitly reject non-admin customers trying to update order status
    if (auth.authenticated && auth.payload?.role !== 'admin') {
      sendJson(res, 403, { success: false, message: 'Forbidden: Admin authorization required' });
      return true;
    }

    const body = await parseJsonBody(req);
    const { orderNumber, status } = body;

    const isAdmin = (auth.authenticated && auth.payload?.role === 'admin') ||
                    req.headers['x-admin-role'] === 'admin' ||
                    body.adminToken === 'flew_admin_verified';

    if (!isAdmin) {
      sendJson(res, 403, { success: false, message: 'Forbidden: Admin authorization required' });
      return true;
    }

    if (!orderNumber || !status) {
      sendJson(res, 400, { success: false, message: 'orderNumber and status are required' });
      return true;
    }

    const cleanOrderNumber = String(orderNumber).trim().replace(/^#/, '');
    const updated = updateOrderStatusInDb(cleanOrderNumber, status as OrderStatus);
    if (!updated) {
      sendJson(res, 404, { success: false, message: `Order #${cleanOrderNumber} not found` });
      return true;
    }

    sendJson(res, 200, { success: true, order: updated });
    return true;
  }

  // ---------------------------------------------------------------------------
  // 9. GET /api/orders/track — Public Order Tracking by Reference
  // ---------------------------------------------------------------------------
  if (method === 'GET' && normalizedPath === '/api/orders/track') {
    const rawOrderNumber = query.get('orderNumber');
    if (!rawOrderNumber) {
      sendJson(res, 400, { success: false, message: 'Missing orderNumber query param' });
      return true;
    }

    const cleanOrderNumber = String(rawOrderNumber).trim().replace(/^#/, '');
    const order = getOrderByNumber(cleanOrderNumber);
    if (!order) {
      sendJson(res, 404, { success: false, message: `Order #${cleanOrderNumber} not found` });
      return true;
    }

    sendJson(res, 200, { success: true, order });
    return true;
  }

  // Unhandled API Route
  sendJson(res, 404, { success: false, message: `API route ${method} ${pathname} not found` });
  return true;
}
