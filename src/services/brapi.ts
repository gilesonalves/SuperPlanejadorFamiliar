const BRAPI_BASE = "https://brapi.dev/api/quote";
const BRAPI_ONE = "https://brapi.dev/api/quote/{ticker}";

function withToken(url: string, token?: string) {
  if (!token) return url;
  return url + (url.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(token);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function handleResponseError(response: Response, context: string): never {
  if (response.status === 401) {
    throw new Error("BRAPI não autorizado. Informe um token válido nas configurações da carteira.");
  }
  throw new Error(`${context} ${response.status}`);
}

export async function fetchQuotesBatch(tickers: string[], token?: string) {
  if (!tickers?.length) return [];
  const groups: string[][] = [];
  for (let i = 0; i < tickers.length; i += 15) groups.push(tickers.slice(i, i + 15));
  const out: any[] = [];
  for (const g of groups) {
    const url = withToken(`${BRAPI_BASE}/${g.join(",")}?range=1d&interval=1d&fundamental=true`, token);
    const r = await fetch(url);
    if (!r.ok) handleResponseError(r, "BRAPI batch");
    const j = await r.json();
    (j?.results ?? []).forEach((it: any) => out.push(it));
  }
  return out;
}

export async function fetchHistory(ticker: string, range = "1mo", interval = "1d", token?: string) {
  const url = withToken(
    BRAPI_ONE.replace("{ticker}", encodeURIComponent(ticker)) + `?range=${range}&interval=${interval}&fundamental=true`,
    token,
  );
  const r = await fetch(url);
  if (!r.ok) handleResponseError(r, "BRAPI history");
  return r.json();
}

export async function fetchQuoteSingle(ticker: string, token?: string) {
  const url = withToken(
    `${BRAPI_BASE}/${encodeURIComponent(ticker)}?range=1d&interval=1d&fundamental=true`,
    token,
  );
  const response = await fetch(url);
  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`BRAPI single ${ticker} ${response.status}: ${txt}`);
  }
  const json = await response.json();
  const item = (json?.results ?? [])[0];
  if (!item) throw new Error(`BRAPI single ${ticker}: vazio`);
  return item;
}

export async function fetchQuotesSequential(
  tickers: string[],
  opts?: { token?: string; delayMs?: number; maxRetries?: number },
) {
  const { token, delayMs = 350, maxRetries = 2 } = opts ?? {};
  const out: any[] = [];
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