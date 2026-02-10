const CLIENT_ID_KEY = "sp_client_id";

function generateClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getClientId(): string {
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
