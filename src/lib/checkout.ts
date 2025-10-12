export async function goCheckout(plan: "pro" | "premium") {
  const response = await fetch(`/api/checkout?plan=${plan}`, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Checkout failed (${response.status})`);
  }
  const { url } = (await response.json()) as { url?: string };
  if (url) {
    window.location.href = url;
  }
}
