import crypto from 'node:crypto';
import { findSession, saveSession, deleteSession, DbSession } from './db';

const SECRET = process.env.SESSION_SECRET || 'flew_super_secret_cat_session_signing_key_2026';

export interface TokenPayload {
  sub: string; // User ID
  phone: string;
  role: 'customer' | 'admin';
  iat: number;
  exp: number;
}

export function signJwtToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresInDays = 30): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInDays * 24 * 60 * 60;

  const fullPayload: TokenPayload = {
    ...payload,
    iat,
    exp,
  };

  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyJwtToken(token: string, checkDb = true): { valid: boolean; payload?: TokenPayload; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'No token provided' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed token structure' };
  }

  const [headerB64, payloadB64, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  // Constant-time comparison
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload: TokenPayload = JSON.parse(payloadJson);

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      return { valid: false, error: 'Token has expired' };
    }

    if (checkDb) {
      const dbSession = findSession(token);
      if (!dbSession) {
        return { valid: false, error: 'Session was revoked or expired' };
      }
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'Failed to decode token payload' };
  }
}

export function issueCustomerSession(userId: string, phoneNumber: string): string {
  const token = signJwtToken({ sub: userId, phone: phoneNumber, role: 'customer' });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  saveSession({
    token,
    userId,
    phoneNumber,
    role: 'customer',
    createdAt: new Date().toISOString(),
    expiresAt,
  });

  return token;
}

export function issueAdminSession(): string {
  const token = signJwtToken({ sub: 'admin_master', phone: 'store_admin', role: 'admin' }, 7);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  saveSession({
    token,
    userId: 'admin_master',
    phoneNumber: 'store_admin',
    role: 'admin',
    createdAt: new Date().toISOString(),
    expiresAt,
  });

  return token;
}

export function revokeSession(token: string): void {
  deleteSession(token);
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function authenticateRequest(req: any): { authenticated: boolean; session?: DbSession; payload?: TokenPayload; error?: string } {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return { authenticated: false, error: 'Missing Authorization header with Bearer token' };
  }

  const jwtCheck = verifyJwtToken(token);
  if (!jwtCheck.valid || !jwtCheck.payload) {
    return { authenticated: false, error: jwtCheck.error || 'Invalid session token' };
  }

  // Also check database for active non-revoked session
  const dbSession = findSession(token);
  if (!dbSession) {
    return { authenticated: false, error: 'Session was revoked or expired' };
  }

  return {
    authenticated: true,
    session: dbSession,
    payload: jwtCheck.payload,
  };
}
