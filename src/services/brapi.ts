const BRAPI_BASE = "https://brapi.dev/api/quote";
const BRAPI_ONE = "https://brapi.dev/api/quote/{ticker}";

type BrapiQuote = Record<string, unknown>;
type BrapiResponse = {
  results?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function withToken(url: string, token?: string) {
  if (!token) return url;
  return url + (url.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(token);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function handleResponseError(response: Response, context: string): never {
  if (response.status === 401) {
    throw new Error("BRAPI não autorizado. Informe um token válido nas configurações da carteira.");
  }
  throw new Error(`${context} ${response.status}`);
}

function extractResults(payload: unknown): BrapiQuote[] {
  if (!isRecord(payload)) return [];
  const { results } = payload as BrapiResponse;
  if (!Array.isArray(results)) return [];
  return results.filter(isRecord) as BrapiQuote[];
}

export async function fetchQuotesBatch(tickers: string[], token?: string): Promise<BrapiQuote[]> {
  if (!tickers?.length) return [];
  const groups: string[][] = [];
  for (let i = 0; i < tickers.length; i += 15) groups.push(tickers.slice(i, i + 15));
  const out: BrapiQuote[] = [];
  for (const g of groups) {
    const url = withToken(`${BRAPI_BASE}/${g.join(",")}?range=1d&interval=1d&fundamental=true`, token);
    const response = await fetch(url);
    if (!response.ok) handleResponseError(response, "BRAPI batch");
    const json = (await response.json()) as unknown;
    for (const item of extractResults(json)) {
      out.push(item);
    }
  }
  return out;
}

export async function fetchHistory(
  ticker: string,
  range = "1mo",
  interval = "1d",
  token?: string,
): Promise<unknown> {
  const url = withToken(
    BRAPI_ONE.replace("{ticker}", encodeURIComponent(ticker)) + `?range=${range}&interval=${interval}&fundamental=true`,
    token,
  );
  const response = await fetch(url);
  if (!response.ok) handleResponseError(response, "BRAPI history");
  return response.json() as Promise<unknown>;
}

export async function fetchQuoteSingle(ticker: string, token?: string): Promise<BrapiQuote> {
  const url = withToken(
    `${BRAPI_BASE}/${encodeURIComponent(ticker)}?range=1d&interval=1d&fundamental=true`,
    token,
  );
  const response = await fetch(url);
  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`BRAPI single ${ticker} ${response.status}: ${txt}`);
  }
  const json = (await response.json()) as unknown;
  const item = extractResults(json)[0];
  if (!item) throw new Error(`BRAPI single ${ticker}: vazio`);
  return item;
}

export async function fetchQuotesSequential(
  tickers: string[],
  opts?: { token?: string; delayMs?: number; maxRetries?: number },
): Promise<BrapiQuote[]> {
  const { token, delayMs = 350, maxRetries = 2 } = opts ?? {};
  const out: BrapiQuote[] = [];
  for (const ticker of tickers) {
    let tries = 0;
    while (true) {
      try {
        const item = await fetchQuoteSingle(ticker, token);
        out.push(item);
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
