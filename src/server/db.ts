import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Order, OrderStatus } from '../types';

export interface DbUser {
  id: string;
  phoneNumber: string; // 10 digits
  formattedPhone: string; // +91 ...
  name: string;
  address?: string;
  isVerified: boolean;
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbSession {
  token: string;
  userId: string;
  phoneNumber: string;
  role: 'customer' | 'admin';
  createdAt: string;
  expiresAt: string;
}

export interface DbRateLimit {
  key: string;
  attempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  blockedUntil: number;
}

interface DatabaseSchema {
  users: DbUser[];
  sessions: DbSession[];
  orders: Order[];
  rateLimits: Record<string, DbRateLimit>;
}

// Determine safe storage path: Vercel serverless only allows /tmp for writes, local uses ./data
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = process.env.DATA_DIR 
  ? path.resolve(process.env.DATA_DIR)
  : (isVercel ? '/tmp/flew_data' : path.join(process.cwd(), 'data'));

const DB_FILE = path.join(DATA_DIR, 'flew_store.json');

// Memory cache
let dbCache: DatabaseSchema | null = null;

function ensureDir(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create directory:', dir, err);
  }
}

function getInitialDatabase(): DatabaseSchema {
  return {
    users: [],
    sessions: [],
    orders: [],
    rateLimits: {},
  };
}

export function getKvCredentials(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
}

export function isCloudDbConfigured(): boolean {
  return getKvCredentials() !== null;
}

export function getCloudDbProviderName(): 'vercel_kv' | 'upstash' | 'local_file' {
  if (process.env.KV_REST_API_URL) return 'vercel_kv';
  if (process.env.UPSTASH_REDIS_REST_URL) return 'upstash';
  return 'local_file';
}

function saveLocalDatabaseFile(data: DatabaseSchema): void {
  ensureDir(DATA_DIR);
  try {
    const serialized = JSON.stringify(data, null, 2);
    const tempFile = `${DB_FILE}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist database file:', err);
  }
}

/**
 * Sync fresh database state from Vercel KV / Upstash Redis across all serverless instances
 */
export async function syncFromCloud(): Promise<DatabaseSchema> {
  const creds = getKvCredentials();
  if (!creds) {
    return loadDatabase();
  }

  try {
    const res = await fetch(`${creds.url}/get/flew_store_db`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${creds.token}`,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        if (parsed && typeof parsed === 'object') {
          dbCache = {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            orders: Array.isArray(parsed.orders) ? parsed.orders : [],
            rateLimits: parsed.rateLimits && typeof parsed.rateLimits === 'object' ? parsed.rateLimits : {},
          };
          saveLocalDatabaseFile(dbCache);
          return dbCache;
        }
      }
    }
  } catch (err) {
    console.error('[FLEW DB] Failed to sync from Cloud KV:', err);
  }

  return loadDatabase();
}

/**
 * Persist database state to Vercel KV / Upstash Redis for global multi-device consistency
 */
export async function syncToCloud(data: DatabaseSchema): Promise<void> {
  dbCache = data;
  saveLocalDatabaseFile(data);

  const creds = getKvCredentials();
  if (!creds) {
    return;
  }

  try {
    const serialized = JSON.stringify(data);
    await fetch(`${creds.url}/set/flew_store_db`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serialized),
    });
  } catch (err) {
    console.error('[FLEW DB] Failed to save to Cloud KV:', err);
  }
}

export function loadDatabase(): DatabaseSchema {
  ensureDir(DATA_DIR);

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      dbCache = {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        rateLimits: parsed.rateLimits && typeof parsed.rateLimits === 'object' ? parsed.rateLimits : {},
      };
      return dbCache;
    }
  } catch (err) {
    console.error('Error reading database file, initializing fresh:', err);
  }

  if (dbCache) {
    return dbCache;
  }

  dbCache = getInitialDatabase();
  saveLocalDatabaseFile(dbCache);
  return dbCache;
}

export function saveDatabase(data: DatabaseSchema): void {
  dbCache = data;
  saveLocalDatabaseFile(data);

  if (isCloudDbConfigured()) {
    syncToCloud(data).catch((err) => {
      console.error('[FLEW DB] Background cloud sync error:', err);
    });
  }
}

// -----------------------------------------------------------------------------
// Customer Account Queries
// -----------------------------------------------------------------------------

export function findUserByPhone(phone10: string): DbUser | undefined {
  const db = loadDatabase();
  const clean = phone10.replace(/[^0-9]/g, '').slice(-10);
  return db.users.find((u) => u.phoneNumber === clean);
}

export function findUserById(id: string): DbUser | undefined {
  const db = loadDatabase();
  return db.users.find((u) => u.id === id);
}

export function upsertCustomerUser(phone: string, name?: string, address?: string): DbUser {
  const db = loadDatabase();
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const formatted = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  const now = new Date().toISOString();

  const existingIdx = db.users.findIndex((u) => u.phoneNumber === cleanPhone);

  if (existingIdx >= 0) {
    const existing = db.users[existingIdx];
    const updated: DbUser = {
      ...existing,
      name: name?.trim() || existing.name,
      address: address?.trim() || existing.address,
      isVerified: true,
      verifiedAt: now,
      updatedAt: now,
    };
    db.users[existingIdx] = updated;
    saveDatabase(db);
    return updated;
  }

  const newUser: DbUser = {
    id: `cust_${crypto.randomBytes(8).toString('hex')}`,
    phoneNumber: cleanPhone,
    formattedPhone: formatted,
    name: name?.trim() || 'Flew Patron',
    address: address?.trim() || '',
    isVerified: true,
    verifiedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  db.users.push(newUser);
  saveDatabase(db);
  return newUser;
}

// -----------------------------------------------------------------------------
// Sessions
// -----------------------------------------------------------------------------

export function saveSession(session: DbSession): void {
  const db = loadDatabase();
  // Remove expired sessions or older sessions for the same user
  const now = new Date().toISOString();
  db.sessions = db.sessions.filter((s) => s.expiresAt > now && s.token !== session.token);
  db.sessions.push(session);
  saveDatabase(db);
}

export function findSession(token: string): DbSession | undefined {
  const db = loadDatabase();
  const now = new Date().toISOString();
  const session = db.sessions.find((s) => s.token === token);
  if (session && session.expiresAt > now) {
    return session;
  }
  return undefined;
}

export function deleteSession(token: string): void {
  const db = loadDatabase();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDatabase(db);
}

// -----------------------------------------------------------------------------
// Orders
// -----------------------------------------------------------------------------

/**
 * Returns everyday sequential order number starting with '0001'.
 * Checks orders created today (local date) and increments max sequence.
 */
export function getNextDailyOrderNumber(): string {
  const db = loadDatabase();
  const todayStr = new Date().toISOString().slice(0, 10);

  let maxSeq = 0;
  for (const o of db.orders) {
    if (o.createdAt && o.createdAt.slice(0, 10) === todayStr) {
      const match = o.orderNumber.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return String(nextSeq).padStart(4, '0');
}

export function saveOrder(order: Order): Order {
  const db = loadDatabase();
  const existingIdx = db.orders.findIndex((o) => o.orderNumber.toUpperCase() === order.orderNumber.trim().toUpperCase());
  if (existingIdx >= 0) {
    db.orders[existingIdx] = order;
  } else {
    db.orders.unshift(order);
  }
  saveDatabase(db);
  return order;
}

export function getAllOrders(filterPhone?: string): Order[] {
  const db = loadDatabase();
  if (!filterPhone) {
    return db.orders;
  }
  const clean = filterPhone.replace(/[^0-9]/g, '').slice(-10);
  return db.orders.filter((o) => o.customerPhone.replace(/[^0-9]/g, '').slice(-10) === clean);
}

export function getOrderByNumber(orderNumber: string): Order | undefined {
  const db = loadDatabase();
  const clean = orderNumber.trim().toUpperCase().replace(/^#/, '');
  return db.orders.find((o) => {
    const oNum = o.orderNumber.toUpperCase().replace(/^#/, '');
    return oNum === clean;
  });
}

export function updateOrderStatusInDb(orderNumber: string, status: OrderStatus): Order | undefined {
  const db = loadDatabase();
  const clean = orderNumber.trim().toUpperCase().replace(/^#/, '');
  const idx = db.orders.findIndex((o) => {
    const oNum = o.orderNumber.toUpperCase().replace(/^#/, '');
    return oNum === clean;
  });
  if (idx >= 0) {
    db.orders[idx] = {
      ...db.orders[idx],
      status,
    };
    saveDatabase(db);
    return db.orders[idx];
  }
  return undefined;
}

// -----------------------------------------------------------------------------
// Rate Limiting
// -----------------------------------------------------------------------------

export function checkAndRecordRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  blockDurationMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const db = loadDatabase();
  const now = Date.now();

  const record = db.rateLimits[key];

  if (record) {
    // Check if currently blocked
    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }

    // Check if within window
    if (now - record.firstAttemptAt < windowMs) {
      record.attempts += 1;
      record.lastAttemptAt = now;

      if (record.attempts > maxAttempts) {
        record.blockedUntil = now + blockDurationMs;
        saveDatabase(db);
        const retryAfter = Math.ceil(blockDurationMs / 1000);
        return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
      }

      saveDatabase(db);
      return { allowed: true, remaining: maxAttempts - record.attempts };
    }
  }

  // New window
  db.rateLimits[key] = {
    key,
    attempts: 1,
    firstAttemptAt: now,
    lastAttemptAt: now,
    blockedUntil: 0,
  };

  saveDatabase(db);
  return { allowed: true, remaining: maxAttempts - 1 };
}
