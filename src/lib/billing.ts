import { supabase } from "@/lib/supabase";

type PlanId = "pro" | "premium";

type CheckoutResponse = {
  url?: string;
};

const headersFor = (accessToken?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
};

export async function createCheckoutSession(planId: PlanId): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: headersFor(accessToken),
    body: JSON.stringify({ planId }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Não foi possível iniciar o checkout.");
  }

  const payload: CheckoutResponse = await response.json();
  if (!payload.url) {
    throw new Error("Resposta inesperada do checkout.");
  }

  window.location.assign(payload.url);
  return payload.url;
}
