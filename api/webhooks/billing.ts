import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

/* Tipos auxiliares para deixar o TS feliz sem any */
type InvoiceWithSub = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};
type LineWithPrice = Stripe.InvoiceLineItem & { price?: Stripe.Price | null };

/* Env */
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? "";

/* Stripe client (sem apiVersion fixa para evitar conflitos de typings) */
const stripe = new Stripe(STRIPE_SECRET_KEY);

/* Utils */
const toIso = (epoch?: number | null): string | null =>
  typeof epoch === "number" ? new Date(epoch * 1000).toISOString() : null;

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function getCurrentPeriodEnd(
  sub: Stripe.Subscription | null | undefined,
): number | undefined {
  const s = sub as unknown as { current_period_end?: number | null };
  return typeof s?.current_period_end === "number"
    ? s.current_period_end
    : undefined;
}

/* Persistência */
async function persistEvent(supa: SupabaseClient, event: Stripe.Event) {
  await supa.from("billing_events").insert({
    provider: "stripe",
    event_type: event.type,
    raw: event as unknown as Record<string, unknown>, // jsonb
  });
}

type UpsertSubscriptionOverrides = {
  user_id?: string | null;
  plan_id?: string | null;
  status?: string;
  current_period_end?: string | null;
  provider_sub_id?: string;
};

async function upsertSubscription(
  supa: SupabaseClient,
  overrides: UpsertSubscriptionOverrides,
) {
  if (!overrides.provider_sub_id) return;

  const resp = await supa
    .from("subscriptions")
    .upsert(
      {
        user_id: overrides.user_id ?? null,
        plan_id: overrides.plan_id ?? null,
        provider: "stripe",
        provider_sub_id: overrides.provider_sub_id!,
        status: overrides.status ?? "active",
        current_period_end: overrides.current_period_end ?? null,
      },
      { onConflict: "provider_sub_id" }
    );
  assertOk(resp, "upsert subscriptions");

  


}

/* 👉 idempotente agora (onConflict: provider_invoice_id) */
async function upsertInvoice(
  supa: SupabaseClient,
  invoice: Stripe.Invoice,
  userIdFallback: string | null,
) {
  const amountCents =
    (typeof invoice.amount_paid === "number" ? invoice.amount_paid : null) ??
    (typeof invoice.total === "number" ? invoice.total : 0);

  await supa
    .from("invoices")
    .upsert(
      {
        provider: "stripe",
        provider_invoice_id: invoice.id,
        user_id: (invoice.metadata?.user_id as string) ?? userIdFallback,
        amount_cents: amountCents,
        currency: (invoice.currency || "brl").toUpperCase(),
        status: invoice.status || "paid",
        issued_at: toIso(invoice.created) ?? new Date().toISOString(),
        pdf_url: invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? null,
      },
      { onConflict: "provider_invoice_id" },
    );
}

async function retrieveSubscription(
  subscriptionId?: string | null,
): Promise<Stripe.Subscription | null> {
  if (!subscriptionId) return null;
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (e) {
    console.error("Stripe subscription retrieve error", e);
    return null;
  }
}

// helper: loga erros do supabase
function assertOk<T>(res: { error: unknown } & T, ctx: string) {
  if (res.error) {
    console.error(`[Supabase] ${ctx} ->`, res.error);
  }
}

// opcional: verificador simples de UUID
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safeUserId = (v: string | null | undefined) =>
  typeof v === "string" && UUID_RE.test(v) ? v : null;


/* Handler */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET)
    return res.status(500).json({ error: "Stripe webhook secrets missing" });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE)
    return res.status(500).json({ error: "Supabase admin credentials missing" });

  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string")
    return res.status(400).json({ error: "Missing Stripe signature" });

  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Stripe webhook signature verification failed", e);
    return res.status(400).json({ error: "Invalid signature" });
  }

  await persistEvent(supa, event);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = (s.subscription as string) ?? null;
        const subscription = await retrieveSubscription(subscriptionId);

        const userId =
          (s.client_reference_id as string) ??
          (s.metadata?.user_id as string) ??
          (subscription?.metadata?.user_id as string) ??
          null;

        const planId =
          (s.metadata?.plan_id as string) ??
          (subscription?.metadata?.plan_id as string) ??
          null;

        await upsertSubscription(supa, {
          provider_sub_id: subscriptionId ?? undefined,
          user_id: userId,
          plan_id: planId,
          status: "active",
          current_period_end: toIso(getCurrentPeriodEnd(subscription) ?? null),
        });
        break;
      }

      case "invoice.paid": {
        const inv = event.data.object as InvoiceWithSub;

        const subscriptionId =
          typeof inv.subscription === "string"
            ? inv.subscription
            : inv.subscription?.id ?? null;

        const subscription = await retrieveSubscription(subscriptionId);

        const firstLine: LineWithPrice | undefined =
          inv.lines?.data?.[0] as LineWithPrice | undefined;
        const linePrice = firstLine?.price ?? undefined;

        const userId =
          safeUserId(inv.metadata?.user_id as string | undefined) ??
          safeUserId(subscription?.metadata?.user_id as string | undefined) ??
          null;


        const planId =
          (inv.metadata?.plan_id as string | undefined) ??
          (subscription?.metadata?.plan_id as string | undefined) ??
          (linePrice?.metadata?.plan_id as string | undefined) ??
          null;

        await upsertSubscription(supa, {
          provider_sub_id: subscriptionId ?? undefined,
          user_id: userId,
          plan_id: planId,
          status: "active",
          current_period_end: toIso(
            getCurrentPeriodEnd(subscription) ??
            (firstLine?.period?.end as number | undefined) ??
            (inv.period_end as number | undefined) ??
            null,
          ),
        });

        await upsertInvoice(supa, inv, userId);
        break;
      }

      case "invoice.payment_failed": {
        const inv = event.data.object as InvoiceWithSub;

        const subscriptionId =
          typeof inv.subscription === "string"
            ? inv.subscription
            : inv.subscription?.id ?? null;

        const subscription = await retrieveSubscription(subscriptionId);

        const firstLine: LineWithPrice | undefined =
          inv.lines?.data?.[0] as LineWithPrice | undefined;
        const linePrice = firstLine?.price ?? undefined;

        const userId =
          safeUserId(inv.metadata?.user_id as string | undefined) ??
          safeUserId(subscription?.metadata?.user_id as string | undefined) ??
          null;


        const planId =
          (inv.metadata?.plan_id as string | undefined) ??
          (subscription?.metadata?.plan_id as string | undefined) ??
          (linePrice?.metadata?.plan_id as string | undefined) ??
          null;

        await upsertSubscription(supa, {
          provider_sub_id: subscriptionId ?? undefined,
          user_id: userId,
          plan_id: planId,
          status: "past_due",
          current_period_end: toIso(getCurrentPeriodEnd(subscription) ?? null),
        });

        await upsertInvoice(supa, inv, userId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata?.user_id as string) ?? null;
        const planId = (sub.metadata?.plan_id as string) ?? null;

        await upsertSubscription(supa, {
          provider_sub_id: sub.id,
          user_id: userId,
          plan_id: planId,
          status: "canceled",
          current_period_end: toIso(getCurrentPeriodEnd(sub) ?? null),
        });
        break;
      }

      default:
        // ignorar outros eventos
        break;
    }
  } catch (e) {
    console.error("Billing webhook handler failed", e);
    return res.status(500).json({ error: "Webhook handling failure" });
  }

  return res.status(200).json({ received: true });
}
