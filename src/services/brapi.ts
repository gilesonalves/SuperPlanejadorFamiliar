const API_QUOTES = "/api/quotes";
const CLIENT_ID_KEY = "sp_client_id";

type BrapiQuote = Record<string, unknown>;
type BrapiResponse = {
  results?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function extractResults(payload: unknown): BrapiQuote[] {
  if (!isRecord(payload)) return [];
  const { results } = payload as BrapiResponse;
  if (!Array.isArray(results)) return [];
  return results.filter(isRecord) as BrapiQuote[];
}

function generateClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getClientId(): string {
  if (typeof window === "undefined") return "anonymous";
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const created = generateClientId();
    localStorage.setItem(CLIENT_ID_KEY, created);
    return created;
  } catch {
    return "anonymous";
  }
}

function buildHeaders(opts?: { countAction?: boolean }): HeadersInit {
  const headers: Record<string, string> = {
    "x-client-id": getClientId(),
  };
  if (opts?.countAction) {
    headers["x-refresh-action"] = "1";
  }
  return headers;
}

export async function fetchQuotesBatch(
  tickers: string[],
  opts?: { countAction?: boolean },
): Promise<BrapiQuote[]> {
  if (!tickers?.length) return [];
  const [first, ...rest] = tickers;
  const results = await Promise.all([
    fetchQuoteSingle(first, { countAction: opts?.countAction }),
    ...rest.map((ticker) => fetchQuoteSingle(ticker)),
  ]);
  return results.filter(Boolean);
}

export async function fetchQuoteSingle(
  ticker: string,
  opts?: { countAction?: boolean },
): Promise<BrapiQuote> {
  const url = `${API_QUOTES}?ticker=${encodeURIComponent(ticker)}`;
  const response = await fetch(url, { headers: buildHeaders(opts) });
  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    if (response.status === 429) {
      let message = "Limite diario (2/dia) atingido. Volte amanha.";
      try {
        const parsed = txt ? (JSON.parse(txt) as unknown) : null;
        if (isRecord(parsed) && typeof parsed.message === "string") {
          message = parsed.message;
        }
      } catch {
        /* empty */
      }
      throw new Error(message);
    }
    throw new Error(`BRAPI single ${ticker} ${response.status}: ${txt}`);
  }
  const json = (await response.json()) as unknown;
  const item = extractResults(json)[0] ?? (isRecord(json) ? (json as BrapiQuote) : null);
  if (!item) throw new Error(`BRAPI single ${ticker}: vazio`);
  return item;
}

export async function fetchQuotesSequential(
  tickers: string[],
  opts?: { delayMs?: number; maxRetries?: number; countAction?: boolean },
): Promise<BrapiQuote[]> {
  const { delayMs = 350, maxRetries = 2, countAction = false } = opts ?? {};
  const out: BrapiQuote[] = [];
  let actionCounted = false;
  for (const ticker of tickers) {
    let tries = 0;
    while (true) {
      try {
        const item = await fetchQuoteSingle(ticker, {
          countAction: countAction && !actionCounted,
        });
        out.push(item);
        actionCounted = actionCounted || countAction;
        break;
      } catch (error) {
        if (tries++ >= maxRetries) {
          throw error;
        }
        await sleep(delayMs * (tries + 1));
      }
    }
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }
  return out;
}
