import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE ?? "";

const toIso = (epochSeconds?: number | null): string | null =>
  typeof epochSeconds === "number" ? new Date(epochSeconds * 1000).toISOString() : null;

const readRawBody = async (req: VercelRequest): Promise<Buffer> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

const persistEvent = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  event: Stripe.Event,
) => {
  await supabaseAdmin.from("billing_events").insert({
    event_id: event.id,
    type: event.type,
    payload: event.data?.object ?? null,
    created_at: new Date().toISOString(),
  });
};

const upsertSubscription = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  stripeSubscription: Stripe.Subscription | null,
  overrides: {
    subscription_id?: string;
    user_id?: string | null;
    plan_id?: string | null;
    status?: string;
    current_period_end?: string | null;
  },
) => {
  const payload = {
    subscription_id: overrides.subscription_id ?? stripeSubscription?.id,
    user_id: overrides.user_id ?? (stripeSubscription?.metadata?.user_id ?? null),
    plan_id: overrides.plan_id ?? (stripeSubscription?.metadata?.plan_id ?? null),
    status: overrides.status ?? stripeSubscription?.status ?? null,
    current_period_end:
      overrides.current_period_end ??
      toIso(stripeSubscription?.current_period_end ?? null),
  };

  if (!payload.subscription_id) return;

  await supabaseAdmin.from("subscriptions").upsert(payload, {
    onConflict: "subscription_id",
  });
};

const insertInvoice = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice,
) => {
  await supabaseAdmin.from("invoices").upsert(
    {
      invoice_id: invoice.id,
      subscription_id: (invoice.subscription as string) ?? null,
      user_id: invoice.metadata?.user_id ?? null,
      plan_id: invoice.metadata?.plan_id ?? invoice.lines?.data[0]?.price?.metadata?.plan_id ?? null,
      status: invoice.status,
      total: invoice.total,
      currency: invoice.currency,
      hosted_invoice_url: invoice.hosted_invoice_url,
      due_date: toIso(invoice.due_date ?? null),
      created_at: toIso(invoice.created ?? null),
    },
    { onConflict: "invoice_id" },
  );
};

const retrieveSubscription = async (stripeClient: Stripe, subscriptionId?: string | null) => {
  if (!subscriptionId) return null;
  try {
    return await stripeClient.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error("Stripe subscription retrieve error", error);
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!stripeSecretKey || !webhookSecret) {
    return res.status(500).json({ error: "Stripe webhook secrets missing" });
  }

  if (!supabaseUrl || !supabaseServiceRole) {
    return res.status(500).json({ error: "Supabase admin credentials missing" });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    return res.status(400).json({ error: "Missing Stripe signature" });
  }

  const stripeClient = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return res.status(400).json({ error: "Invalid signature" });
  }

  await persistEvent(supabaseAdmin, event);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscription = await retrieveSubscription(
          stripeClient,
          session.subscription as string,
        );
        await upsertSubscription(supabaseAdmin, subscription, {
          subscription_id: (session.subscription as string) ?? undefined,
          user_id: session.client_reference_id ?? session.metadata?.user_id ?? null,
          plan_id: session.metadata?.plan_id ?? subscription?.metadata?.plan_id ?? null,
          status: "active",
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await retrieveSubscription(
          stripeClient,
          invoice.subscription as string,
        );
        await upsertSubscription(supabaseAdmin, subscription, {
          subscription_id: (invoice.subscription as string) ?? undefined,
          status: "active",
          current_period_end: toIso(subscription?.current_period_end ?? invoice.lines?.data[0]?.period?.end ?? null),
        });
        await insertInvoice(supabaseAdmin, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await retrieveSubscription(
          stripeClient,
          invoice.subscription as string,
        );
        await upsertSubscription(supabaseAdmin, subscription, {
          subscription_id: (invoice.subscription as string) ?? undefined,
          status: "past_due",
        });
        await insertInvoice(supabaseAdmin, invoice);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscription(supabaseAdmin, subscription, {
          subscription_id: subscription.id,
          status: "canceled",
        });
        break;
      }

      default:
        // noop for unhandled events
        break;
    }
  } catch (error) {
    console.error("Billing webhook handler failed", error);
    return res.status(500).json({ error: "Webhook handling failure" });
  }

  return res.status(200).json({ received: true });
}
