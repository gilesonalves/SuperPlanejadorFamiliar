export type FetchEntitlementsError =
  | {
      kind: "non-json";
      status: number;
      url: string;
      bodySnippet: string;
    }
  | {
      kind: "http";
      status: number;
      url: string;
      body: unknown;
    };

const JSON_HEADER = "application/json";

export async function fetchEntitlements<T = unknown>(
  accessToken?: string | null,
  anonKeyOverride?: string,
): Promise<T> {
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("VITE_SUPABASE_URL is not configured");
  }

  const anon = anonKeyOverride ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  const bearer = (accessToken?.trim() || anon).trim();

  const url = `${baseUrl}/functions/v1/entitlements`;

  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    headers: {
      "content-type": JSON_HEADER,
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    body: "{}",
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes(JSON_HEADER)) {
    const bodySnippet = (await response.text().catch(() => "")).slice(0, 200);
    throw {
      kind: "non-json" as const,
      status: response.status,
      url,
      bodySnippet,
    };
  }

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw {
      kind: "http" as const,
      status: response.status,
      url,
      body: payload,
    };
  }

  return payload as T;
}
