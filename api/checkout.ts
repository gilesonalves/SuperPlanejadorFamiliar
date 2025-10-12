import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

type PlanId = "pro" | "premium";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
const successUrl = process.env.CHECKOUT_SUCCESS_URL ?? "";
const cancelUrl = process.env.CHECKOUT_CANCEL_URL ?? "";
const priceMap: Record<PlanId, string | undefined> = {
  pro: process.env.PRICE_PRO_MONTH,
  premium: process.env.PRICE_PREMIUM_MONTH,
};

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE ?? "";

const parseBody = (body: unknown): { planId?: unknown } => {
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as { planId?: unknown };
    } catch {
      return {};
    }
  }
  if (typeof body === "object" && body !== null) {
    return body as { planId?: unknown };
  }
  return {};
};

const extractAccessToken = (req: VercelRequest): string | undefined => {
  const header = req.headers.authorization ?? req.headers.Authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((entry) => {
      const [key, ...rest] = entry.trim().split("=");
      return [key, rest.join("=")];
    }),
  );

  return cookies["sb-access-token"] ?? cookies["sb-at"] ?? undefined;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!stripeSecretKey || !successUrl || !cancelUrl) {
    return res.status(500).json({ error: "Stripe environment not configured" });
  }

  if (!supabaseUrl || !supabaseServiceRole) {
    return res.status(500).json({ error: "Supabase admin environment missing" });
  }

  const token = extractAccessToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = parseBody(req.body);
  const planFromQueryRaw = req.query?.plan;
  const planFromQuery =
    typeof planFromQueryRaw === "string"
      ? planFromQueryRaw
      : Array.isArray(planFromQueryRaw)
        ? planFromQueryRaw[0]
        : undefined;
  const planFromBody = typeof payload.planId === "string" ? payload.planId : undefined;
  const planId = planFromQuery ?? planFromBody;

  if (planId !== "pro" && planId !== "premium") {
    return res.status(400).json({ error: "Plano inválido." });
  }

  const price = priceMap[planId];
  if (!price) {
    return res.status(500).json({ error: `Stripe price ID ausente para ${planId}` });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
  });

  const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userResult.user) {
    return res.status(401).json({ error: "Sessão inválida" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: userResult.user.email ?? undefined,
      client_reference_id: userResult.user.id,
      metadata: {
        plan_id: planId,
        user_id: userResult.user.id,
      },
      subscription_data: {
        metadata: {
          plan_id: planId,
          user_id: userResult.user.id,
        },
      },
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error", error);
    return res.status(500).json({ error: "Falha ao iniciar checkout" });
  }
}
