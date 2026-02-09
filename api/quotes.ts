import type { VercelRequest, VercelResponse } from "@vercel/node";
// DEV-only fallback: garante que .env.local seja carregado quando `vercel dev` não injeta env na function
if (process.env.NODE_ENV !== "production" && !process.env.BRAPI_TOKEN) {
  try {
    const dotenv = await import("dotenv");
    dotenv.config({ path: ".env.local" });
  } catch {
    // Se dotenv falhar, o handler seguirá e retornará missing_server_token
  }
}

const BRAPI_BASE = "https://brapi.dev/api/quote";
const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:8080"];

const CACHE_PREFIX = "quotes:ticker:";
const LIMIT_PREFIX = "quotes:limit:";
const DIAGNOSTICS_ENABLED = process.env.QUOTES_DIAGNOSTICS === "1";

type CacheEntry = {
  expiresAt: number;
  payload: unknown;
  status: number;
};

const quoteCache = new Map<string, CacheEntry>();
const dailyLimits = new Map<string, number>();

function normalizeTicker(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return null;
  if (!/^[A-Z0-9._-]{1,20}$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeClientId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(trimmed)) return null;
  return trimmed;
}

function getAllowedOrigins(): Set<string> {
  const extra = process.env.QUOTES_ALLOWED_ORIGINS ?? "";
  const list = extra
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...list]);
}

function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin && getAllowedOrigins().has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-client-id, x-refresh-action");
}

function getCacheTtlMs(): number {
  const raw = Number(process.env.QUOTES_CACHE_TTL_MINUTES);
  if (Number.isFinite(raw) && raw > 0) return raw * 60 * 1000;
  return 30 * 60 * 1000;
}

function getDailyLimit(): number {
  const raw = Number(process.env.QUOTES_USER_DAILY_LIMIT);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 2;
}

function getCacheKey(ticker: string): string {
  return `${CACHE_PREFIX}${ticker}`;
}

function withCacheHit(payload: unknown, cacheHit: boolean): unknown {
  if (payload && typeof payload === "object") {
    return { ...(payload as Record<string, unknown>), cacheHit };
  }
  return { cacheHit, data: payload };
}

function getCachedQuote(ticker: string): CacheEntry | null {
  const key = getCacheKey(ticker);
  const entry = quoteCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    quoteCache.delete(key);
    return null;
  }
  return entry;
}

function setCachedQuote(ticker: string, entry: CacheEntry) {
  quoteCache.set(getCacheKey(ticker), entry);
}

function maybeCleanupLimits() {
  if (dailyLimits.size < 2000) return;
  const today = new Date().toISOString().slice(0, 10);
  for (const key of dailyLimits.keys()) {
    if (!key.endsWith(`:${today}`)) {
      dailyLimits.delete(key);
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  applyCors(req, res);

  if (DIAGNOSTICS_ENABLED && process.env.NODE_ENV !== "production") {
    const keys = Object.keys(process.env).filter(
      (key) => key.includes("BRAPI") || key.includes("QUOTES"),
    );
    console.log("[quotes] env keys:", keys);
    console.log("[quotes] has BRAPI_TOKEN:", Boolean(process.env.BRAPI_TOKEN));
    res.setHeader("x-has-brapi-token", process.env.BRAPI_TOKEN ? "1" : "0");
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const ticker = normalizeTicker(req.query.ticker);
  if (!ticker) {
    return res.status(400).json({ error: "invalid_ticker" });
  }

  const refreshAction = req.headers["x-refresh-action"];
  const shouldCountAction = refreshAction === "1" || refreshAction === "true";
  if (shouldCountAction) {
    const clientId = normalizeClientId(req.headers["x-client-id"]);
    if (!clientId) {
      return res.status(400).json({ error: "missing_client_id" });
    }
    const today = new Date().toISOString().slice(0, 10);
    const limit = getDailyLimit();
    const limitKey = `${LIMIT_PREFIX}${clientId}:${today}`;
    const current = dailyLimits.get(limitKey) ?? 0;
    if (current >= limit) {
      return res.status(429).json({
        error: "daily_limit",
        message: "Limite diario (2/dia) atingido. Volte amanha.",
      });
    }
    dailyLimits.set(limitKey, current + 1);
    maybeCleanupLimits();
  }

  const cached = getCachedQuote(ticker);
  if (cached) {
    return res.status(cached.status).json(withCacheHit(cached.payload, true));
  }

  const token = process.env.BRAPI_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "missing_server_token", missing: "BRAPI_TOKEN" });
  }

  const url = `${BRAPI_BASE}/${encodeURIComponent(ticker)}?range=1d&interval=1d&fundamental=true`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  try {
    const data = text ? JSON.parse(text) : null;
    if (response.ok) {
      setCachedQuote(ticker, {
        expiresAt: Date.now() + getCacheTtlMs(),
        payload: data ?? {},
        status: response.status,
      });
    }
    return res.status(response.status).json(withCacheHit(data ?? {}, false));
  } catch {
    return res.status(response.status).json({ error: "invalid_brapi_response", raw: text });
  }
}
