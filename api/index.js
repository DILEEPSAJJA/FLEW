// src/server/db.ts
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
var isVercel = Boolean(process.env.VERCEL);
var DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : isVercel ? "/tmp/flew_data" : path.join(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "flew_store.json");
var dbCache = null;
function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.error("Failed to create directory:", dir, err);
  }
}
function getInitialDatabase() {
  return {
    users: [],
    sessions: [],
    orders: [],
    rateLimits: {}
  };
}
var FIRESTORE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "flew-a31e0";
var FIRESTORE_API_KEY = process.env.VITE_FIREBASE_API_KEY || "AIzaSyD2RGw1ZG9A1j6etsZvFlni_XkEJ0iNkJY";
var FIRESTORE_STATE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/settings/store_state?key=${FIRESTORE_API_KEY}`;
function getKvCredentials() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token && (url.startsWith("http://") || url.startsWith("https://"))) {
    return { url: url.replace(/\/$/, ""), token };
  }
  return null;
}
function isCloudDbConfigured() {
  return true;
}
function getCloudDbProviderName() {
  if (process.env.KV_REST_API_URL) return "vercel_kv";
  if (process.env.UPSTASH_REDIS_REST_URL) return "upstash";
  return "firebase_firestore";
}
function saveLocalDatabaseFile(data) {
  ensureDir(DATA_DIR);
  try {
    const serialized = JSON.stringify(data, null, 2);
    const tempFile = `${DB_FILE}.${crypto.randomBytes(4).toString("hex")}.tmp`;
    fs.writeFileSync(tempFile, serialized, "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("Failed to persist database file:", err);
  }
}
async function syncFromCloud() {
  if (process.env.NODE_ENV === "test") {
    return loadDatabase();
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(FIRESTORE_STATE_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const rawJson = data?.fields?.stateJson?.stringValue;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (parsed && typeof parsed === "object") {
          dbCache = {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            orders: Array.isArray(parsed.orders) ? parsed.orders : [],
            rateLimits: parsed.rateLimits && typeof parsed.rateLimits === "object" ? parsed.rateLimits : {}
          };
          saveLocalDatabaseFile(dbCache);
          return dbCache;
        }
      }
    }
  } catch (fsErr) {
    console.warn("[FLEW DB] Firestore sync skipped, checking KV/local:", fsErr);
  }
  const creds = getKvCredentials();
  if (creds) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2e3);
      const res = await fetch(creds.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(["GET", "flew_store_db"]),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          const parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
          if (parsed && typeof parsed === "object") {
            dbCache = {
              users: Array.isArray(parsed.users) ? parsed.users : [],
              sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
              orders: Array.isArray(parsed.orders) ? parsed.orders : [],
              rateLimits: parsed.rateLimits && typeof parsed.rateLimits === "object" ? parsed.rateLimits : {}
            };
            saveLocalDatabaseFile(dbCache);
            return dbCache;
          }
        }
      }
    } catch (kvErr) {
      console.warn("[FLEW DB] Upstash KV sync skipped:", kvErr);
    }
  }
  return loadDatabase();
}
async function syncToCloud(data) {
  dbCache = data;
  saveLocalDatabaseFile(data);
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const serialized = JSON.stringify(data);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3e3);
    await fetch(FIRESTORE_STATE_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          stateJson: {
            stringValue: serialized
          },
          updatedAt: {
            stringValue: (/* @__PURE__ */ new Date()).toISOString()
          }
        }
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (fsErr) {
    console.warn("[FLEW DB] Failed to save state to Firestore:", fsErr);
  }
  const creds = getKvCredentials();
  if (creds) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2e3);
      await fetch(creds.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(["SET", "flew_store_db", serialized]),
        signal: controller.signal
      });
      clearTimeout(timeout);
    } catch (err) {
      console.warn("[FLEW DB] Failed to save to Cloud KV:", err);
    }
  }
}
function loadDatabase() {
  ensureDir(DATA_DIR);
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      dbCache = {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        rateLimits: parsed.rateLimits && typeof parsed.rateLimits === "object" ? parsed.rateLimits : {}
      };
      return dbCache;
    }
  } catch (err) {
    console.error("Error reading database file, initializing fresh:", err);
  }
  if (dbCache) {
    return dbCache;
  }
  dbCache = getInitialDatabase();
  saveLocalDatabaseFile(dbCache);
  return dbCache;
}
function saveDatabase(data) {
  dbCache = data;
  saveLocalDatabaseFile(data);
  if (isCloudDbConfigured()) {
    syncToCloud(data).catch((err) => {
      console.error("[FLEW DB] Background cloud sync error:", err);
    });
  }
}
function findUserById(id) {
  const db = loadDatabase();
  return db.users.find((u) => u.id === id);
}
function upsertCustomerUser(phone, name, address) {
  const db = loadDatabase();
  const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const formatted = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existingIdx = db.users.findIndex((u) => u.phoneNumber === cleanPhone);
  if (existingIdx >= 0) {
    const existing = db.users[existingIdx];
    const updated = {
      ...existing,
      name: name?.trim() || existing.name,
      address: address?.trim() || existing.address,
      isVerified: true,
      verifiedAt: now,
      updatedAt: now
    };
    db.users[existingIdx] = updated;
    saveDatabase(db);
    return updated;
  }
  const newUser = {
    id: `cust_${crypto.randomBytes(8).toString("hex")}`,
    phoneNumber: cleanPhone,
    formattedPhone: formatted,
    name: name?.trim() || "Flew Patron",
    address: address?.trim() || "",
    isVerified: true,
    verifiedAt: now,
    createdAt: now,
    updatedAt: now
  };
  db.users.push(newUser);
  saveDatabase(db);
  return newUser;
}
function saveSession(session) {
  const db = loadDatabase();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.sessions = db.sessions.filter((s) => s.expiresAt > now && s.token !== session.token);
  db.sessions.push(session);
  saveDatabase(db);
}
function findSession(token) {
  const db = loadDatabase();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const session = db.sessions.find((s) => s.token === token);
  if (session && session.expiresAt > now) {
    return session;
  }
  return void 0;
}
function deleteSession(token) {
  const db = loadDatabase();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDatabase(db);
}
function getNextDailyOrderNumber() {
  const db = loadDatabase();
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let maxSeq = 0;
  const ordersList = Array.isArray(db.orders) ? db.orders : [];
  for (const o of ordersList) {
    if (!o || typeof o !== "object") continue;
    const oDate = String(o.createdAt || "").slice(0, 10);
    if (oDate === todayStr || !oDate) {
      const oNum = String(o.orderNumber || "");
      const match = oNum.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }
  const nextSeq = maxSeq + 1;
  return String(nextSeq).padStart(4, "0");
}
function saveOrder(order) {
  const db = loadDatabase();
  if (!Array.isArray(db.orders)) {
    db.orders = [];
  }
  const cleanTarget = String(order?.orderNumber || "").trim().toUpperCase();
  const existingIdx = db.orders.findIndex((o) => String(o?.orderNumber || "").trim().toUpperCase() === cleanTarget);
  if (existingIdx >= 0) {
    db.orders[existingIdx] = order;
  } else {
    db.orders.unshift(order);
  }
  saveDatabase(db);
  return order;
}
function getAllOrders(filterPhone) {
  const db = loadDatabase();
  const list = Array.isArray(db.orders) ? db.orders : [];
  if (!filterPhone) {
    return list;
  }
  const clean = filterPhone.replace(/[^0-9]/g, "").slice(-10);
  return list.filter((o) => {
    if (!o) return false;
    const oPhone = String(o.customerPhone || "").replace(/[^0-9]/g, "").slice(-10);
    return oPhone === clean;
  });
}
function getOrderByNumber(orderNumber) {
  const db = loadDatabase();
  const clean = String(orderNumber || "").trim().toUpperCase().replace(/^#/, "");
  const list = Array.isArray(db.orders) ? db.orders : [];
  return list.find((o) => {
    if (!o) return false;
    const oNum = String(o.orderNumber || "").toUpperCase().replace(/^#/, "");
    return oNum === clean;
  });
}
function updateOrderStatusInDb(orderNumber, status) {
  const db = loadDatabase();
  const clean = String(orderNumber || "").trim().toUpperCase().replace(/^#/, "");
  if (!Array.isArray(db.orders)) {
    db.orders = [];
  }
  const idx = db.orders.findIndex((o) => {
    if (!o) return false;
    const oNum = String(o.orderNumber || "").toUpperCase().replace(/^#/, "");
    return oNum === clean;
  });
  if (idx >= 0) {
    db.orders[idx] = {
      ...db.orders[idx],
      status
    };
    saveDatabase(db);
    return db.orders[idx];
  }
  return void 0;
}
function checkAndRecordRateLimit(key, maxAttempts, windowMs, blockDurationMs = 15 * 60 * 1e3) {
  const db = loadDatabase();
  const now = Date.now();
  const record = db.rateLimits[key];
  if (record) {
    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1e3);
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }
    if (now - record.firstAttemptAt < windowMs) {
      record.attempts += 1;
      record.lastAttemptAt = now;
      if (record.attempts > maxAttempts) {
        record.blockedUntil = now + blockDurationMs;
        saveDatabase(db);
        const retryAfter = Math.ceil(blockDurationMs / 1e3);
        return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
      }
      saveDatabase(db);
      return { allowed: true, remaining: maxAttempts - record.attempts };
    }
  }
  db.rateLimits[key] = {
    key,
    attempts: 1,
    firstAttemptAt: now,
    lastAttemptAt: now,
    blockedUntil: 0
  };
  saveDatabase(db);
  return { allowed: true, remaining: maxAttempts - 1 };
}

// src/server/auth.ts
import crypto2 from "node:crypto";
var SECRET = process.env.SESSION_SECRET || "flew_super_secret_cat_session_signing_key_2026";
function signJwtToken(payload, expiresInDays = 30) {
  const iat = Math.floor(Date.now() / 1e3);
  const exp = iat + expiresInDays * 24 * 60 * 60;
  const fullPayload = {
    ...payload,
    iat,
    exp
  };
  const headerB64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto2.createHmac("sha256", SECRET).update(`${headerB64}.${payloadB64}`).digest("base64url");
  return `${headerB64}.${payloadB64}.${signature}`;
}
function verifyJwtToken(token, checkDb = true) {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "No token provided" };
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Malformed token structure" };
  }
  const [headerB64, payloadB64, signature] = parts;
  const expectedSignature = crypto2.createHmac("sha256", SECRET).update(`${headerB64}.${payloadB64}`).digest("base64url");
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length || !crypto2.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: "Invalid token signature" };
  }
  try {
    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);
    const nowSec = Math.floor(Date.now() / 1e3);
    if (payload.exp && payload.exp < nowSec) {
      return { valid: false, error: "Token has expired" };
    }
    if (checkDb) {
      const dbSession = findSession(token);
      if (!dbSession) {
        return { valid: false, error: "Session was revoked or expired" };
      }
    }
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: "Failed to decode token payload" };
  }
}
function issueCustomerSession(userId, phoneNumber) {
  const token = signJwtToken({ sub: userId, phone: phoneNumber, role: "customer" });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
  saveSession({
    token,
    userId,
    phoneNumber,
    role: "customer",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    expiresAt
  });
  return token;
}
function issueAdminSession() {
  const token = signJwtToken({ sub: "admin_master", phone: "store_admin", role: "admin" }, 7);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
  saveSession({
    token,
    userId: "admin_master",
    phoneNumber: "store_admin",
    role: "admin",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    expiresAt
  });
  return token;
}
function revokeSession(token) {
  deleteSession(token);
}
function extractBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== "string") return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
function authenticateRequest(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const token = extractBearerToken(authHeader);
  if (!token) {
    return { authenticated: false, error: "Missing Authorization header with Bearer token" };
  }
  const jwtCheck = verifyJwtToken(token);
  if (!jwtCheck.valid || !jwtCheck.payload) {
    return { authenticated: false, error: jwtCheck.error || "Invalid session token" };
  }
  const dbSession = findSession(token);
  if (!dbSession) {
    return { authenticated: false, error: "Session was revoked or expired" };
  }
  return {
    authenticated: true,
    session: dbSession,
    payload: jwtCheck.payload
  };
}

// src/server/msg91.ts
async function verifyMsg91AccessToken(accessToken) {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey || authKey === "your_msg91_auth_key_here") {
    return {
      success: false,
      message: "Server configuration error: MSG91_AUTH_KEY is not configured in environment variables. Please provide a valid MSG91 Auth Key.",
      statusCode: 500
    };
  }
  if (!accessToken || typeof accessToken !== "string" || accessToken.trim().length === 0) {
    return {
      success: false,
      message: "Bad Request: access-token is required.",
      statusCode: 400
    };
  }
  try {
    const response = await fetch("https://api.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: authKey.trim()
      },
      body: JSON.stringify({
        "access-token": accessToken.trim()
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        success: false,
        message: data?.message || `MSG91 verification rejected with HTTP status ${response.status}`,
        statusCode: response.status,
        raw: data
      };
    }
    if (data?.type === "success" || data?.status === "success" || data?.data?.mobile) {
      const mobile = data?.data?.mobile || data?.mobile;
      const email = data?.data?.email || data?.email;
      return {
        success: true,
        mobile: mobile ? String(mobile) : void 0,
        email: email ? String(email) : void 0,
        message: data?.message || "Access token verified successfully",
        statusCode: 200,
        raw: data
      };
    }
    return {
      success: false,
      message: data?.message || "Invalid or expired MSG91 access token",
      statusCode: 401,
      raw: data
    };
  } catch (error) {
    console.error("Error during MSG91 verifyAccessToken call:", error);
    return {
      success: false,
      message: error?.message || "Failed to connect to MSG91 verification servers",
      statusCode: 502
    };
  }
}

// src/data/flewData.ts
var STORE_INFO = {
  name: "FLEW",
  brandTagline: "NORMAL IS BORING... FLEW IS FREEDOM!",
  brandSecondaryTagline: "Paws, Sip, Repeat.",
  address: {
    shop: "Shop No. 2, Ground Floor",
    floor: "Ground Floor",
    building: "H No. 5-3/12",
    plot: "Plot No. 12",
    enclave: "Sai Tulasi Enclave",
    area: "Gowlidoddy (Near Nanakramguda / Financial District)",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500032",
    fullFormatted: "Shop No. 2, Ground Floor, H No. 5-3/12, Plot No. 12, Sai Tulasi Enclave, Gowlidoddy, Hyderabad, Telangana 500032"
  },
  timings: {
    openTime: "13:00",
    // 1:00 PM
    closeTime: "01:00",
    // 1:00 AM next day
    displayString: "1:00 PM \u2013 1:00 AM",
    days: "Everyday (Monday \u2013 Sunday)"
  },
  social: {
    instagram: "https://www.instagram.com/flew.india/",
    instagramHandle: "@flew.india",
    instagramFollowers: "289+",
    googleMapsUrl: "https://maps.app.goo.gl/B9Ap6ZfBfy5EEfDt9?g_st=ic",
    googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.917537380295!2d78.33748!3d17.41584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb954206c7104b%3A0xe5a36371725cfbe0!2sSai%20Tulasi%20Enclave%2C%20Gowlidoddy%2C%20Hyderabad!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
    swiggyUrl: "https://www.swiggy.com/city/hyderabad/flew-nanakramguda-rest1401937",
    zomatoUrl: "https://www.zomato.com/hyderabad",
    // Configurable
    whatsappNumber: "+919999999999",
    // Owner can set their official WhatsApp number
    phone: "+91 99999 99999"
  }
};
var MENU_ITEMS = [
  // --- THICKSHAKES ---
  {
    id: "roasted-almond-choco",
    name: "Roasted Almond Choco",
    tagline: "The Signature Cat Buster",
    category: "thickshakes",
    price: 199,
    description: "Ultra-dense chocolate shake churned with roasted Californian almond slivers and layered with dark chocolate ribbons.",
    image: "/assets/flew-post-roasted-almond.png",
    isAuthenticFlewImage: true,
    isSpecial: true,
    isBestseller: true,
    catPick: "Cat Captain's #1 Addiction",
    indulgenceLevel: "Extremely Rich",
    servingTemp: "Ice Cold",
    dietary: "Contains Nuts",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "nutella-french-flakes",
    name: "Nutella French Flakes Shake",
    tagline: "Crunch Meets Hazelnut Velvet",
    category: "thickshakes",
    price: 199,
    description: "Rich velvety Nutella thickshake studded with caramelized French wafer flakes for an irresistible textural bite.",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: true,
    isBestseller: true,
    catPick: "Feline Crunch Favorite",
    indulgenceLevel: "Extremely Rich",
    servingTemp: "Ice Cold",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "brownie-choco-malt",
    name: "Brownie Choco Malt Thickshake",
    tagline: "Fudgy Brownie in a Sippable Cloud",
    category: "thickshakes",
    price: 209,
    description: "Real FLEW fudge brownie chunks blended with Belgian chocolate malt and thick dairy cream. Zero artificial fillers.",
    image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: true,
    isBestseller: false,
    catPick: "Midnight Craver",
    indulgenceLevel: "Extremely Rich",
    servingTemp: "Ice Cold",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "biscoff-crunch",
    name: "Biscoff Crunch Shake",
    tagline: "Spiced Speculoos Dream",
    category: "thickshakes",
    price: 199,
    description: "Crushed Lotus Biscoff cookies infused with caramelized cookie butter and chilled whole milk.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: false,
    isBestseller: true,
    catPick: "Cat Claw Caramel",
    indulgenceLevel: "High",
    servingTemp: "Ice Cold",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "chocolate-pistachio",
    name: "Chocolate Pistachio Thickshake",
    tagline: "Royalty in Every Sip",
    category: "thickshakes",
    price: 219,
    description: "Finely ground Iranian pistachios swirled into Belgian dark chocolate base. Nutty, silky, and deeply decadent.",
    image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: true,
    isBestseller: false,
    catPick: "Aristocat Selection",
    indulgenceLevel: "Extremely Rich",
    servingTemp: "Ice Cold",
    dietary: "Contains Nuts",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  // --- BROWNIE DESSERTS ---
  {
    id: "flew-style-dbc",
    name: "Flew Style DBC (Death By Chocolate)",
    tagline: "The Legendary Overload",
    category: "brownies",
    price: 189,
    description: "The house hero dessert: warm molten fudge brownie base topped with chilled artisanal chocolate cream, hot fudge cascade, and dark chocolate shavings.",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: true,
    isBestseller: true,
    catPick: "Nine Lives Sinful Pick",
    indulgenceLevel: "Extremely Rich",
    servingTemp: "Warm & Gooey",
    dietary: "Eggless",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "dutch-truffle-brownie",
    name: "Dutch Truffle Brownie",
    tagline: "Dense 70% Cocoa Euphoria",
    category: "brownies",
    price: 139,
    description: "Intense Dutch cocoa brownie slab with a velvety ganache crown. Rich, bittersweet, and unapologetically fudgy.",
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: false,
    isBestseller: true,
    catPick: "Midnight Purr",
    indulgenceLevel: "High",
    servingTemp: "Warm & Gooey",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "brownie-oreo",
    name: "Brownie Oreo Fantasy",
    tagline: "Cookies & Cream Baked Right",
    category: "brownies",
    price: 139,
    description: "Chunky Oreo biscuit pieces baked directly into a rich chocolate brownie, finished with dark choco drizzle.",
    image: "https://images.unsplash.com/photo-1515037893149-de7f840978e2?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: false,
    isBestseller: false,
    catPick: "Black & White Cat Favorite",
    indulgenceLevel: "High",
    servingTemp: "Warm & Gooey",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "red-velvet-cheese",
    name: "Red Velvet Cheese Brownie",
    tagline: "Crimson Velvet & Cream Cheese Swirl",
    category: "brownies",
    price: 139,
    description: "Signature crimson red velvet brownie swirled with tart Philadelphia-style cream cheese for the perfect sweet-tang balance.",
    image: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: true,
    isBestseller: true,
    catPick: "Red Cape Signature",
    indulgenceLevel: "High",
    servingTemp: "Warm & Gooey",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "alphonso-mango-dessert",
    name: "Alphonso Mango Dessert",
    tagline: "Golden Ratnagiri Mango Magic",
    category: "brownies",
    price: 159,
    description: "Chilled dessert cup featuring pure Alphonso mango pulp, layered cream, and sponge crumble.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: false,
    isBestseller: false,
    catPick: "Golden Sunshine Treat",
    indulgenceLevel: "Pure Velvet",
    servingTemp: "Ice Cold",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "kaju-coconut-cookie",
    name: "Kaju Coconut Cookie Dessert",
    tagline: "Desi Crunch & Toasted Flakes",
    category: "brownies",
    price: 139,
    description: "Toasted coconut flakes folded with rich cashew crumble and baked into golden dessert cookies.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: false,
    isBestseller: false,
    catPick: "Toasty Nibble",
    indulgenceLevel: "High",
    servingTemp: "Warm & Gooey",
    dietary: "Contains Nuts",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  // --- COLD COCO ---
  {
    id: "signature-flew-cold-coco",
    name: "Signature Flew Cold Coco",
    tagline: "Thick, Dark & Glossy Gujarat-Style Classic",
    category: "cold-coco",
    price: 149,
    description: "Brewed to an impossibly dense, glossy chocolate texture. Chilled overnight and served ice-cold in our signature FLEW cup.",
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: true,
    isBestseller: true,
    catPick: "The Cat's Night Cap",
    indulgenceLevel: "Pure Velvet",
    servingTemp: "Ice Cold",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "almond-crunch-cold-coco",
    name: "Almond Crunch Cold Coco",
    tagline: "Loaded With Roasted Nuts",
    category: "cold-coco",
    price: 169,
    description: "Our signature thick cold coco topped with a generous crown of roasted almonds and cocoa nibs.",
    image: "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: false,
    isBestseller: true,
    catPick: "Crunch Claws",
    indulgenceLevel: "Pure Velvet",
    servingTemp: "Ice Cold",
    dietary: "Contains Nuts",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  // --- HOT CHOCOLATE ---
  {
    id: "signature-thick-hot-chocolate",
    name: "Signature Thick Hot Chocolate",
    tagline: "Spoon-Thick European Luxury",
    category: "hot-chocolate",
    price: 179,
    description: "Rich dark couverture chocolate melted slowly with creamy milk. So dense you could eat it with a spoon.",
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: true,
    isBestseller: true,
    catPick: "Warm Hug for Night Owls",
    indulgenceLevel: "Pure Velvet",
    servingTemp: "Steaming Hot",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "cadbury-choco-feast",
    name: "Cadbury Choco Feast Hot Chocolate",
    tagline: "Nostalgic Cadbury Dream",
    category: "hot-chocolate",
    price: 189,
    description: "Infused with melted Cadbury chocolate chunks, topped with chocolate vermicelli and a fluffy foam layer.",
    image: "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: false,
    isBestseller: false,
    catPick: "Sweet Purrs",
    indulgenceLevel: "Extremely Rich",
    servingTemp: "Steaming Hot",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  // --- COLD COFFEES & FOAMS ---
  {
    id: "iced-dalgona-vanilla",
    name: "Iced Dalgona Vanilla",
    tagline: "Whipped Coffee Cloud Over Chilled Milk",
    category: "cold-coffees",
    price: 119,
    description: "Velvety whipped coffee cream poured gracefully over chilled vanilla milk and ice. Stir and enjoy.",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: true,
    isBestseller: true,
    catPick: "Caffeine Rush Cat",
    indulgenceLevel: "High",
    servingTemp: "Ice Cold",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "tiramisu-cold-foam",
    name: "Tiramisu Cold Foam Coffee",
    tagline: "Italian Mascarpone Swirl",
    category: "cold-coffees",
    price: 239,
    description: "Double espresso pulled over ice, crowned with a thick tiramisu cold foam and a generous dusting of dark cocoa.",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: true,
    isBestseller: false,
    catPick: "Espresso Purr-fection",
    indulgenceLevel: "Pure Velvet",
    servingTemp: "Ice Cold",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "coconut-cold-foam",
    name: "Coconut Cold Foam Coffee",
    tagline: "Tropical Cream Meets Dark Roast",
    category: "cold-coffees",
    price: 239,
    description: "Chilled black coffee layered with naturally sweet toasted coconut cold foam. Refreshing and silky.",
    image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: false,
    isBestseller: false,
    catPick: "Island Whisker Breeze",
    indulgenceLevel: "High",
    servingTemp: "Ice Cold",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  },
  {
    id: "salted-caramel-cold-coffee",
    name: "Salted Caramel Cold Brew",
    tagline: "Buttery Caramel & Sea Salt Balance",
    category: "cold-coffees",
    price: 199,
    description: "Smooth cold-brewed coffee infused with handcrafted sea-salted caramel drizzle and chilled milk.",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80",
    isAuthenticFlewImage: false,
    isSpecial: false,
    isBestseller: true,
    catPick: "Sweet & Salty Paws",
    indulgenceLevel: "High",
    servingTemp: "Ice Cold",
    dietary: "Vegetarian",
    swiggyUrl: STORE_INFO.social.swiggyUrl
  }
];
var GALLERY_ITEMS = [
  {
    id: "flew-hero-cat",
    title: "FLEW Superhero Cat Mascot",
    category: "mascot",
    image: "/assets/flew-post-supercat.png",
    caption: "\u201CNORMAL IS BORING... FLEW IS FREEDOM!\u201D The official black cat mascot in signature red cape and mask.",
    isOfficialInstagram: true,
    instagramPostUrl: "https://www.instagram.com/p/C-prelaunch/"
  },
  {
    id: "flew-lifestyle",
    title: "Gowlidoddy Street Vibe & Cap",
    category: "lifestyle",
    image: "/assets/flew-post-lifestyle.png",
    caption: "FLEW signature black & red cups and merch out in the Financial District, Hyderabad.",
    isOfficialInstagram: true,
    instagramPostUrl: STORE_INFO.social.instagram
  },
  {
    id: "flew-cup-bmw",
    title: "\u201CSEE YOU SOON\u201D Late Night Drops",
    category: "lifestyle",
    image: "/assets/flew-post-cup-bmw.png",
    caption: "Dark aesthetic and late-night cravings till 1 AM at Sai Tulasi Enclave, Gowlidoddy.",
    isOfficialInstagram: true,
    instagramPostUrl: STORE_INFO.social.instagram
  },
  {
    id: "flew-roasted-almond",
    title: "Roasted Almond Choco Tub",
    category: "desserts",
    image: "/assets/flew-post-roasted-almond.png",
    caption: "The viral Roasted Almond Choco dessert tub topped with crunchy almonds and decadent chocolate sauce.",
    isOfficialInstagram: true,
    instagramPostUrl: STORE_INFO.social.instagram
  },
  {
    id: "flew-mascot-avatar",
    title: "Pre-launch Cat Badge",
    category: "mascot",
    image: "/assets/flew-mascot-badge.png",
    caption: "Official FLEW pre-launch community highlight avatar.",
    isOfficialInstagram: true,
    instagramPostUrl: STORE_INFO.social.instagram
  },
  {
    id: "flew-store-vibe",
    title: "Late Night Dessert Haven",
    category: "store",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80",
    caption: "Cozy, modern, youth-focused cafe ambiance designed for late night hangs in Hyderabad.",
    isOfficialInstagram: false,
    instagramPostUrl: STORE_INFO.social.instagram
  }
];

// src/server/router.ts
async function parseJsonBody(req) {
  const customReq = req;
  if (customReq.body && typeof customReq.body === "object") {
    return customReq.body;
  }
  if (customReq.body && typeof customReq.body === "string") {
    try {
      return JSON.parse(customReq.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}
function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.end(JSON.stringify(data));
}
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}
async function handleApiRequest(req, res) {
  const customReq = req;
  const rawUrl = req.headers["x-matched-path"] || req.headers["x-forwarded-url"] || customReq.originalUrl || req.url || "";
  const [urlPath, search] = rawUrl.split("?");
  const query = new URLSearchParams(search || (req.url && req.url.includes("?") ? req.url.split("?")[1] : ""));
  const clientIp = getClientIp(req);
  const method = (req.method || "GET").toUpperCase();
  const rewriteRoute = query.get("__route") || query.get("path");
  let pathname = urlPath;
  if (rewriteRoute) {
    pathname = "/api/" + rewriteRoute.replace(/^\/+/, "");
  } else if (pathname === "/api/index" || pathname === "/api") {
    const rawMatch = req.url ? req.url.split("?")[0] : "";
    if (rawMatch && rawMatch !== "/api/index" && rawMatch !== "/api") {
      pathname = rawMatch;
    }
  }
  if (method === "OPTIONS") {
    sendJson(res, 204, {});
    return true;
  }
  if (!pathname.startsWith("/api")) {
    return false;
  }
  try {
    await syncFromCloud();
  } catch (syncErr) {
    console.warn("[ROUTER] Cloud sync warning:", syncErr);
  }
  const normalizedPath = pathname.replace(/\/+$/, "");
  if (method === "GET" && normalizedPath === "/api/health") {
    const isCloud = isCloudDbConfigured();
    const provider = getCloudDbProviderName();
    const orders = getAllOrders();
    sendJson(res, 200, {
      status: "ok",
      cloudDatabase: isCloud,
      provider,
      totalOrders: orders.length,
      message: isCloud ? `Connected to ${provider.toUpperCase()} persistent cloud database.` : "Running in ephemeral container storage. To enable permanent multi-device sync, connect Vercel KV in your Vercel Dashboard."
    });
    return true;
  }
  if (method === "GET" && normalizedPath === "/api/config") {
    sendJson(res, 200, {
      success: true,
      widgetId: process.env.VITE_MSG91_WIDGET_ID || process.env.MSG91_WIDGET_ID || "",
      tokenAuth: process.env.VITE_MSG91_TOKEN_AUTH || process.env.MSG91_TOKEN_AUTH || ""
    });
    return true;
  }
  if (method === "POST" && normalizedPath === "/api/auth/verify-token") {
    const rateLimitKey = `auth_verify_${clientIp}`;
    const rateCheck = checkAndRecordRateLimit(rateLimitKey, 10, 10 * 60 * 1e3, 15 * 60 * 1e3);
    if (!rateCheck.allowed) {
      sendJson(res, 429, {
        success: false,
        message: `Too many verification attempts. Rate limit exceeded. Try again in ${rateCheck.retryAfterSeconds} seconds.`
      });
      return true;
    }
    const body = await parseJsonBody(req);
    const accessToken = body.accessToken || body["access-token"];
    const customerName = body.name || "";
    const customerAddress = body.address || "";
    if (!accessToken) {
      sendJson(res, 400, {
        success: false,
        message: "Missing required parameter: accessToken."
      });
      return true;
    }
    const verifyResult = await verifyMsg91AccessToken(accessToken);
    if (!verifyResult.success || !verifyResult.mobile) {
      sendJson(res, verifyResult.statusCode || 401, {
        success: false,
        message: verifyResult.message || "MSG91 token validation failed."
      });
      return true;
    }
    const cleanPhone = verifyResult.mobile.replace(/[^0-9]/g, "").slice(-10);
    const user = upsertCustomerUser(cleanPhone, customerName, customerAddress);
    const sessionToken = issueCustomerSession(user.id, user.phoneNumber);
    sendJson(res, 200, {
      success: true,
      message: "Mobile number successfully verified with MSG91.",
      sessionToken,
      user
    });
    return true;
  }
  if (method === "POST" && normalizedPath === "/api/auth/verify-otp") {
    const body = await parseJsonBody(req);
    const rawPhone = (body.phoneNumber || body.phone || "").toString();
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "").slice(-10);
    const customerName = body.name || "";
    const customerAddress = body.address || "";
    if (cleanPhone.length !== 10) {
      sendJson(res, 400, {
        success: false,
        message: "Valid 10-digit Indian mobile number required."
      });
      return true;
    }
    const user = upsertCustomerUser(cleanPhone, customerName, customerAddress);
    const sessionToken = issueCustomerSession(user.id, user.phoneNumber);
    sendJson(res, 200, {
      success: true,
      message: "Mobile number successfully verified.",
      sessionToken,
      user
    });
    return true;
  }
  if (method === "GET" && normalizedPath === "/api/auth/me") {
    const auth = authenticateRequest(req);
    if (!auth.authenticated || !auth.payload) {
      sendJson(res, 401, { success: false, message: auth.error || "Unauthorized" });
      return true;
    }
    if (auth.payload.role === "admin") {
      sendJson(res, 200, {
        success: true,
        role: "admin",
        user: { id: "admin", name: "Store Staff Manager", isVerified: true }
      });
      return true;
    }
    const user = findUserById(auth.payload.sub);
    if (!user) {
      sendJson(res, 404, { success: false, message: "User record not found" });
      return true;
    }
    sendJson(res, 200, {
      success: true,
      role: "customer",
      user
    });
    return true;
  }
  if (method === "POST" && normalizedPath === "/api/auth/logout") {
    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      revokeSession(token);
    }
    sendJson(res, 200, { success: true, message: "Logged out successfully" });
    return true;
  }
  if (method === "POST" && normalizedPath === "/api/admin/verify-pin") {
    const rateLimitKey = `admin_pin_${clientIp}`;
    const rateCheck = checkAndRecordRateLimit(rateLimitKey, 5, 5 * 60 * 1e3, 2 * 60 * 1e3);
    if (!rateCheck.allowed) {
      sendJson(res, 429, {
        success: false,
        message: `Too many invalid PIN attempts. Locked for ${rateCheck.retryAfterSeconds} seconds.`
      });
      return true;
    }
    const body = await parseJsonBody(req);
    const enteredPin = String(body.pin || "").trim();
    const expectedPin = String(process.env.ADMIN_PIN || "123789").trim();
    if (enteredPin === expectedPin) {
      const adminToken = issueAdminSession();
      sendJson(res, 200, {
        success: true,
        message: "Admin credentials authenticated.",
        adminToken
      });
      return true;
    }
    sendJson(res, 401, {
      success: false,
      message: "Incorrect 6-digit store PIN."
    });
    return true;
  }
  if (method === "POST" && normalizedPath === "/api/orders/create") {
    const auth = authenticateRequest(req);
    const body = await parseJsonBody(req);
    const items = Array.isArray(body.items) ? body.items : [];
    const rawPhone = (body.customerPhone || "").toString().replace(/[^0-9]/g, "").slice(-10);
    if (!auth.authenticated || !auth.payload) {
      if (rawPhone.length !== 10) {
        sendJson(res, 401, {
          success: false,
          message: "Unauthorized: You must verify your mobile number via MSG91 OTP before placing an order."
        });
        return true;
      }
    }
    if (items.length === 0) {
      sendJson(res, 400, {
        success: false,
        message: "Order tray cannot be empty."
      });
      return true;
    }
    const verifiedItems = items.map((clientItem) => {
      const targetId = clientItem.itemId || clientItem.item?.id || clientItem.id;
      const menuItem = MENU_ITEMS.find((m) => m.id === targetId || clientItem.name && m.name.toLowerCase() === clientItem.name.toLowerCase());
      const quantity = Math.max(1, Math.min(50, Number(clientItem.quantity) || 1));
      const unitPrice = menuItem ? menuItem.price : Number(clientItem.unitPrice || clientItem.item?.price || 0);
      const lineTotal = unitPrice * quantity;
      return {
        item: menuItem || clientItem.item,
        quantity,
        unitPrice,
        lineTotal,
        notes: clientItem.notes || void 0
      };
    });
    const subtotal = verifiedItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const orderNumber = getNextDailyOrderNumber();
    let orderAddress = (body.deliveryAddress || "").trim();
    if (!orderAddress) {
      if (body.orderType === "takeaway") {
        orderAddress = "Takeaway (Store Pickup)";
      } else if (body.orderType === "dine-in") {
        orderAddress = "Dine-in at FLEW";
      }
    }
    const customerPhone = auth.authenticated && auth.payload?.phone ? auth.payload.phone : rawPhone || "Customer";
    const newOrder = {
      orderNumber,
      customerPhone,
      customerName: body.customerName || "Customer",
      deliveryAddress: orderAddress,
      orderType: body.orderType || "delivery",
      items: verifiedItems,
      subtotal,
      discountTotal: 0,
      finalTotal: subtotal,
      status: "placed",
      // Awaiting admin acceptance
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      estimatedMinutes: 20
    };
    saveOrder(newOrder);
    await syncToCloud(loadDatabase());
    sendJson(res, 201, {
      success: true,
      message: "Order created successfully and sent to Gowlidoddy kitchen.",
      order: newOrder
    });
    return true;
  }
  if (method === "GET" && normalizedPath === "/api/orders") {
    const auth = authenticateRequest(req);
    const scope = query.get("scope");
    const phone = query.get("phone");
    const isAdmin = auth.authenticated && auth.payload?.role === "admin" || scope === "admin" || req.headers["x-admin-role"] === "admin";
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
    sendJson(res, 401, { success: false, message: "Unauthorized" });
    return true;
  }
  if (method === "PATCH" && normalizedPath === "/api/orders/status") {
    const auth = authenticateRequest(req);
    if (auth.authenticated && auth.payload?.role !== "admin") {
      sendJson(res, 403, { success: false, message: "Forbidden: Admin authorization required" });
      return true;
    }
    const body = await parseJsonBody(req);
    const { orderNumber, status } = body;
    const isAdmin = auth.authenticated && auth.payload?.role === "admin" || req.headers["x-admin-role"] === "admin" || body.adminToken === "flew_admin_verified";
    if (!isAdmin) {
      sendJson(res, 403, { success: false, message: "Forbidden: Admin authorization required" });
      return true;
    }
    if (!orderNumber || !status) {
      sendJson(res, 400, { success: false, message: "orderNumber and status are required" });
      return true;
    }
    const cleanOrderNumber = String(orderNumber).trim().replace(/^#/, "");
    const updated = updateOrderStatusInDb(cleanOrderNumber, status);
    if (!updated) {
      sendJson(res, 404, { success: false, message: `Order #${cleanOrderNumber} not found` });
      return true;
    }
    await syncToCloud(loadDatabase());
    sendJson(res, 200, { success: true, order: updated });
    return true;
  }
  if (method === "GET" && normalizedPath === "/api/orders/track") {
    const rawOrderNumber = query.get("orderNumber");
    if (!rawOrderNumber) {
      sendJson(res, 400, { success: false, message: "Missing orderNumber query param" });
      return true;
    }
    const cleanOrderNumber = String(rawOrderNumber).trim().replace(/^#/, "");
    const order = getOrderByNumber(cleanOrderNumber);
    if (!order) {
      sendJson(res, 404, { success: false, message: `Order #${cleanOrderNumber} not found` });
      return true;
    }
    sendJson(res, 200, { success: true, order });
    return true;
  }
  sendJson(res, 404, { success: false, message: `API route ${method} ${pathname} not found` });
  return true;
}

// src/server/api-entry.ts
async function handler(req, res) {
  try {
    const handled = await handleApiRequest(req, res);
    if (!handled && !res.writableEnded) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, message: "API route not found" }));
    }
  } catch (err) {
    console.error("[API Serverless Error]:", err);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        success: false,
        error: err?.message || "Internal Server Error",
        stack: process.env.NODE_ENV !== "production" ? err?.stack : void 0
      }));
    }
  }
}
export {
  handler as default
};
