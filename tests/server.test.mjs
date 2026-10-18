import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createServer as createViteServer } from 'vite';

// Ensure test environment variables are loaded
process.env.NODE_ENV = 'test';
process.env.ADMIN_PIN = '123789';
process.env.SESSION_SECRET = 'flew_test_jwt_secret_key_cat_gowlidoddy_hyderabad';
process.env.VITE_MSG91_WIDGET_ID = '336662446c64373435303732';

// In-memory mock HTTP request
class MockRequest extends EventEmitter {
  constructor(method, url, body = null, headers = {}, ip = '127.0.0.1') {
    super();
    this.method = method.toUpperCase();
    this.url = url;
    this.body = body;
    this.headers = {
      'content-type': 'application/json',
      ...headers,
    };
    this.socket = { remoteAddress: ip };
  }
}

// In-memory mock HTTP response
class MockResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.body = '';
  }

  setHeader(name, val) {
    this.headers[name.toLowerCase()] = val;
  }

  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }

  end(chunk) {
    if (chunk) {
      this.body += chunk;
    }
    this.emit('finish');
  }

  json() {
    try {
      return JSON.parse(this.body);
    } catch {
      return null;
    }
  }
}

describe('FLEW Backend & Security Test Suite', () => {
  let vite;
  let handleApiRequest;
  let issueCustomerSession;
  let issueAdminSession;
  let verifyJwtToken;
  let revokeSession;
  let validateIndianMobileNumber;
  let upsertCustomerUser;

  before(async () => {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      optimizeDeps: { noDiscovery: true },
    });

    const routerModule = await vite.ssrLoadModule('/src/server/router.ts');
    handleApiRequest = routerModule.handleApiRequest;

    const authModule = await vite.ssrLoadModule('/src/server/auth.ts');
    issueCustomerSession = authModule.issueCustomerSession;
    issueAdminSession = authModule.issueAdminSession;
    verifyJwtToken = authModule.verifyJwtToken;
    revokeSession = authModule.revokeSession;

    const dbModule = await vite.ssrLoadModule('/src/server/db.ts');
    upsertCustomerUser = dbModule.upsertCustomerUser;

    const msg91Module = await vite.ssrLoadModule('/src/utils/msg91.ts');
    validateIndianMobileNumber = msg91Module.validateIndianMobileNumber;
  });

  after(async () => {
    if (vite) {
      await vite.close();
    }
  });

  // Helper function to dispatch mock requests through router
  async function dispatch(method, url, body = null, headers = {}, ip = '127.0.0.1') {
    const req = new MockRequest(method, url, body, headers, ip);
    const res = new MockResponse();
    await handleApiRequest(req, res);
    return res;
  }

  // ---------------------------------------------------------------------------
  // 1. Indian Mobile Number Validation
  // ---------------------------------------------------------------------------
  describe('1. Indian Mobile Number Validator', () => {
    test('accepts valid 10-digit Indian numbers starting with 6, 7, 8, 9', () => {
      const numbers = ['9876543210', '8123456789', '7012345678', '6301234567'];
      for (const num of numbers) {
        const res = validateIndianMobileNumber(num);
        assert.equal(res.valid, true, `Expected ${num} to be valid`);
        assert.equal(res.cleanPhone, num);
        assert.ok(res.formatted?.startsWith('+91 '));
      }
    });

    test('normalizes numbers with country code (+91 or 91) and leading zero (0)', () => {
      const withCountry = validateIndianMobileNumber('+919876543210');
      assert.equal(withCountry.valid, true);
      assert.equal(withCountry.cleanPhone, '9876543210');

      const with91 = validateIndianMobileNumber('919876543210');
      assert.equal(with91.valid, true);
      assert.equal(with91.cleanPhone, '9876543210');

      const withZero = validateIndianMobileNumber('09876543210');
      assert.equal(withZero.valid, true);
      assert.equal(withZero.cleanPhone, '9876543210');
    });

    test('rejects numbers not starting with 6-9 (e.g. starting with 1, 2, 3, 4, 5)', () => {
      const invalidStarts = ['5123456789', '4123456789', '3123456789', '2123456789', '1123456789'];
      for (const num of invalidStarts) {
        const res = validateIndianMobileNumber(num);
        assert.equal(res.valid, false);
        assert.match(res.error || '', /starting with 6, 7, 8, or 9/);
      }
    });

    test('rejects numbers with invalid lengths or non-numeric characters', () => {
      assert.equal(validateIndianMobileNumber('987654321').valid, false); // 9 digits
      assert.equal(validateIndianMobileNumber('987654321000').valid, false); // 12 digits
      assert.equal(validateIndianMobileNumber('').valid, false);
      assert.equal(validateIndianMobileNumber('abcdefghij').valid, false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Cryptographic JWT Session Management
  // ---------------------------------------------------------------------------
  describe('2. JWT Session Security & Revocation', () => {
    test('issues valid customer token and correctly decodes verified payload', () => {
      const token = issueCustomerSession('cust_test_123', '9876543210');
      assert.ok(typeof token === 'string');
      assert.equal(token.split('.').length, 3);

      const verification = verifyJwtToken(token);
      assert.equal(verification.valid, true);
      assert.equal(verification.payload?.sub, 'cust_test_123');
      assert.equal(verification.payload?.phone, '9876543210');
      assert.equal(verification.payload?.role, 'customer');
    });

    test('issues valid admin token with role "admin"', () => {
      const token = issueAdminSession();
      const verification = verifyJwtToken(token);
      assert.equal(verification.valid, true);
      assert.equal(verification.payload?.role, 'admin');
    });

    test('rejects tampered tokens with manipulated payload or signature', () => {
      const token = issueCustomerSession('cust_test_123', '9876543210');
      const parts = token.split('.');
      
      // Tamper payload (middle part)
      const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'hacked_admin', role: 'admin' })).toString('base64url');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
      
      const verification = verifyJwtToken(tamperedToken);
      assert.equal(verification.valid, false);
      assert.match(verification.error || '', /Invalid token signature/);
    });

    test('revoking a session invalidates subsequent verification', () => {
      const token = issueCustomerSession('cust_rev_123', '9876543210');
      assert.equal(verifyJwtToken(token).valid, true);

      revokeSession(token);
      const afterRevoke = verifyJwtToken(token);
      assert.equal(afterRevoke.valid, false);
      assert.match(afterRevoke.error || '', /revoked/);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Admin 6-Digit PIN Security & Brute-Force Rate Limiting
  // ---------------------------------------------------------------------------
  describe('3. Admin 6-Digit PIN Authentication & Rate Limiting', () => {
    test('authenticates successfully with default PIN 123789 and returns admin JWT', async () => {
      const res = await dispatch('POST', '/api/admin/verify-pin', { pin: '123789' }, {}, '10.0.0.1');
      assert.equal(res.statusCode, 200);
      const json = res.json();
      assert.equal(json.success, true);
      assert.ok(json.adminToken);
      
      // Verify issued admin token
      const verified = verifyJwtToken(json.adminToken);
      assert.equal(verified.valid, true);
      assert.equal(verified.payload?.role, 'admin');
    });

    test('rejects incorrect PIN with 401 Unauthorized', async () => {
      const res = await dispatch('POST', '/api/admin/verify-pin', { pin: '999999' }, {}, '10.0.0.2');
      assert.equal(res.statusCode, 401);
      const json = res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /Incorrect 6-digit store PIN/);
    });

    test('triggers 429 Too Many Requests and locks out after 5 consecutive failed attempts', async () => {
      const bruteIp = `192.168.${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 200 + 10)}`;
      // Attempt 1 to 5 incorrect PINs
      for (let i = 1; i <= 5; i++) {
        const res = await dispatch('POST', '/api/admin/verify-pin', { pin: `00000${i}` }, {}, bruteIp);
        assert.equal(res.statusCode, 401);
      }

      // 6th attempt should be blocked by rate limiter
      const blockedRes = await dispatch('POST', '/api/admin/verify-pin', { pin: '123789' }, {}, bruteIp);
      assert.equal(blockedRes.statusCode, 429);
      const json = blockedRes.json();
      assert.equal(json.success, false);
      assert.match(json.message, /Too many invalid PIN attempts. Locked for/);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. MSG91 OTP Token Verification Server Endpoint
  // ---------------------------------------------------------------------------
  describe('4. MSG91 Token Verification Endpoint (/api/auth/verify-token)', () => {
    test('returns 400 Bad Request when accessToken is missing', async () => {
      const res = await dispatch('POST', '/api/auth/verify-token', {}, {}, '10.0.1.1');
      assert.equal(res.statusCode, 400);
      const json = res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /Missing required parameter: accessToken/);
    });

    test('rejects dummy/invalid access tokens without trusting client-side flags', async () => {
      const res = await dispatch('POST', '/api/auth/verify-token', {
        accessToken: 'simulated_fake_msg91_token_test',
        name: 'Test Patron',
      }, {}, '10.0.1.2');

      // The backend contacts MSG91 or rejects invalid tokens server-side with failure status
      assert.ok(res.statusCode >= 400);
      const json = res.json();
      assert.equal(json.success, false);
    });

    test('verifies direct OTP endpoint (/api/auth/verify-otp) and issues valid customer session', async () => {
      const res = await dispatch('POST', '/api/auth/verify-otp', {
        phoneNumber: '9876543210',
        name: 'Dileep Sajja',
      });
      assert.equal(res.statusCode, 200);
      const json = res.json();
      assert.equal(json.success, true);
      assert.ok(json.sessionToken);
      assert.equal(json.user?.phoneNumber, '9876543210');
    });

    test('rejects /api/auth/verify-otp with invalid phone number', async () => {
      const res = await dispatch('POST', '/api/auth/verify-otp', {
        phoneNumber: '123',
      });
      assert.equal(res.statusCode, 400);
      const json = res.json();
      assert.equal(json.success, false);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Protected Order Creation & Server-Side Price Validation
  // ---------------------------------------------------------------------------
  describe('5. Protected Order Creation & Price Security', () => {
    test('rejects order creation without authentication (401 Unauthorized)', async () => {
      const res = await dispatch('POST', '/api/orders/create', {
        items: [{ itemId: 'roasted-almond-choco', quantity: 1 }],
      });
      assert.equal(res.statusCode, 401);
      const json = res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /Unauthorized/);
    });

    test('rejects order creation with empty item tray (400 Bad Request)', async () => {
      const customerToken = issueCustomerSession('cust_valid_1', '9876543210');
      const res = await dispatch('POST', '/api/orders/create', {
        items: [],
      }, {
        authorization: `Bearer ${customerToken}`,
      });
      assert.equal(res.statusCode, 400);
      const json = res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /tray cannot be empty/);
    });

    test('successfully places order with authenticated customer session and validates prices against menu', async () => {
      const customerToken = issueCustomerSession('cust_valid_2', '9876543210');

      // Attempt to tamper price on the client side: send price = 1 for a 199 item
      const res = await dispatch('POST', '/api/orders/create', {
        customerName: 'Aarav Sharma',
        deliveryAddress: 'Sai Tulasi Enclave, Gowlidoddy',
        orderType: 'delivery',
        items: [
          {
            itemId: 'roasted-almond-choco',
            quantity: 2,
            unitPrice: 1, // Tampered client price!
          },
        ],
      }, {
        authorization: `Bearer ${customerToken}`,
      });

      assert.equal(res.statusCode, 201);
      const json = res.json();
      assert.equal(json.success, true);
      assert.ok(json.order);
      assert.match(json.order.orderNumber, /^\d{4}$/);
      assert.equal(json.order.customerPhone, '9876543210');
      assert.equal(json.order.status, 'placed');

      // Crucial security check: unitPrice must be validated against official MENU_ITEMS (₹199 each -> ₹398)
      // Client cannot force ₹1 per item
      const item = json.order.items[0];
      assert.equal(item.unitPrice, 199);
      assert.equal(item.lineTotal, 398);
      assert.equal(json.order.subtotal, 398);
      assert.equal(json.order.finalTotal, 398);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Order Status Management & Tracking
  // ---------------------------------------------------------------------------
  describe('6. Order Status Management & Public Tracking', () => {
    let createdOrderNumber;

    before(async () => {
      const token = issueCustomerSession('cust_track_1', '9876543210');
      const res = await dispatch('POST', '/api/orders/create', {
        customerName: 'Priya Reddy',
        items: [{ itemId: 'roasted-almond-choco', quantity: 1 }],
      }, {
        authorization: `Bearer ${token}`,
      });
      createdOrderNumber = res.json()?.order?.orderNumber;
    });

    test('allows public tracking by order number', async () => {
      assert.ok(createdOrderNumber);
      const res = await dispatch('GET', `/api/orders/track?orderNumber=${createdOrderNumber}`);
      assert.equal(res.statusCode, 200);
      const json = res.json();
      assert.equal(json.success, true);
      assert.equal(json.order?.orderNumber, createdOrderNumber);
      assert.equal(json.order?.status, 'placed');
    });

    test('prevents non-admin customers from updating order status (403 Forbidden)', async () => {
      const customerToken = issueCustomerSession('cust_track_1', '9876543210');
      const res = await dispatch('PATCH', '/api/orders/status', {
        orderNumber: createdOrderNumber,
        status: 'out-for-delivery',
      }, {
        authorization: `Bearer ${customerToken}`,
      });

      assert.equal(res.statusCode, 403);
      const json = res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /Forbidden/);
    });

    test('allows admin to update order status through lifecycle', async () => {
      const adminToken = issueAdminSession();
      const res = await dispatch('PATCH', '/api/orders/status', {
        orderNumber: createdOrderNumber,
        status: 'out-for-delivery',
      }, {
        authorization: `Bearer ${adminToken}`,
      });

      assert.equal(res.statusCode, 200);
      const json = res.json();
      assert.equal(json.success, true);
      assert.equal(json.order?.status, 'out-for-delivery');

      // Verify status is reflected in public tracker
      const trackRes = await dispatch('GET', `/api/orders/track?orderNumber=${createdOrderNumber}`);
      assert.equal(trackRes.json()?.order?.status, 'out-for-delivery');
    });

    test('allows admin portal to poll all orders via scope=admin', async () => {
      const res = await dispatch('GET', '/api/orders?scope=admin');
      assert.equal(res.statusCode, 200);
      const json = res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.orders));
      assert.ok(json.orders.length > 0);
    });

    test('allows order creation with valid Indian customer phone and verifies placed status for admin acceptance', async () => {
      const res = await dispatch('POST', '/api/orders/create', {
        customerName: 'Kavya Sharma',
        customerPhone: '+91 98480 12345',
        deliveryAddress: 'Flat 304, Gowlidoddy, Hyderabad',
        orderType: 'delivery',
        items: [{ itemId: 'roasted-almond-choco', quantity: 1 }],
      });

      assert.equal(res.statusCode, 201);
      const json = res.json();
      assert.equal(json.success, true);
      assert.equal(json.order?.status, 'placed');
      assert.equal(json.order?.customerPhone, '9848012345');

      // Admin accepts the order to start kitchen preparation
      const adminToken = issueAdminSession();
      const acceptRes = await dispatch('PATCH', '/api/orders/status', {
        orderNumber: json.order.orderNumber,
        status: 'preparing',
      }, {
        authorization: `Bearer ${adminToken}`,
      });

      assert.equal(acceptRes.statusCode, 200);
      assert.equal(acceptRes.json()?.order?.status, 'preparing');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Profile & Session Revocation
  // ---------------------------------------------------------------------------
  describe('7. Profile (/api/auth/me) & Logout Endpoints', () => {
    test('retrieves customer profile with valid session token', async () => {
      const user = upsertCustomerUser('9123456780', 'Rohan Verma', 'Plot 12, Gowlidoddy');
      const token = issueCustomerSession(user.id, user.phoneNumber);

      const res = await dispatch('GET', '/api/auth/me', null, {
        authorization: `Bearer ${token}`,
      });

      assert.equal(res.statusCode, 200);
      const json = res.json();
      assert.equal(json.success, true);
      assert.equal(json.role, 'customer');
      assert.equal(json.user?.phoneNumber, '9123456780');
    });

    test('retrieves admin profile with valid admin session token', async () => {
      const adminToken = issueAdminSession();
      const res = await dispatch('GET', '/api/auth/me', null, {
        authorization: `Bearer ${adminToken}`,
      });

      assert.equal(res.statusCode, 200);
      const json = res.json();
      assert.equal(json.success, true);
      assert.equal(json.role, 'admin');
    });

    test('logout revokes session, preventing further authenticated requests', async () => {
      const user = upsertCustomerUser('9888877777', 'Kiran Rao');
      const token = issueCustomerSession(user.id, user.phoneNumber);

      // Verify profile works
      const res1 = await dispatch('GET', '/api/auth/me', null, {
        authorization: `Bearer ${token}`,
      });
      assert.equal(res1.statusCode, 200);

      // Call logout
      const logoutRes = await dispatch('POST', '/api/auth/logout', null, {
        authorization: `Bearer ${token}`,
      });
      assert.equal(logoutRes.statusCode, 200);

      // Next request with same token fails with 401
      const res2 = await dispatch('GET', '/api/auth/me', null, {
        authorization: `Bearer ${token}`,
      });
      assert.equal(res2.statusCode, 401);
    });
  });
});
