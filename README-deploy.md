# Deploy do SuperPlanejador

Este guia resume as variáveis de ambiente, execução local e implantação nas funções serverless da Vercel com webhooks de billing.

## Variáveis de ambiente

Defina as chaves abaixo em `.env` (local) e no painel da Vercel:

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: credenciais públicas do Supabase.
- `SUPABASE_SERVICE_ROLE`: chave service role usada pelas funções `/api/*` para persistência de assinaturas.
- `STRIPE_PUBLIC_KEY` / `STRIPE_SECRET_KEY`: chaves da API Stripe usadas no checkout serverless.
- `STRIPE_WEBHOOK_SECRET`: segredo do endpoint de webhook configurado no painel Stripe.
- `CHECKOUT_SUCCESS_URL` e `CHECKOUT_CANCEL_URL`: URLs de retorno usadas pelo checkout.
- `PRICE_PRO_MONTH` / `PRICE_PREMIUM_MONTH`: IDs dos preços de assinatura mensal no Stripe.
- Flags padrão: `FEATURE_OPEN_FINANCE`, `FEATURE_CARDS_MODULE`, `FEATURE_CATEGORY_LIMITS`, `FEATURE_GOALS`,
  `FEATURE_CASH_FORECAST`, `FEATURE_REPORTS`, `FEATURE_EXPORTS`, `FEATURE_MULTI_PROFILE`.

## Execução local

1. Instale as dependências com `npm install`.
2. Crie um arquivo `.env` copiando de `.env.example` e ajuste as chaves locais.
3. Rode `npm run dev` para iniciar o Vite e `vercel dev` para exercitar as rotas `/api` quando necessário.
4. Para testar o webhook Stripe localmente, utilize `stripe listen --forward-to localhost:3000/api/webhooks/billing`.

## Implantação na Vercel

- As funções serverless residem em `/api`. Ao fazer deploy pela Vercel, elas são publicadas automaticamente.
- Configure as variáveis acima no projeto Vercel, incluindo `SUPABASE_SERVICE_ROLE` como Secret.
- Crie um endpoint de webhook no Stripe apontando para `https://<seu-deploy>/api/webhooks/billing`.

## Eventos de webhook suportados

| Evento Stripe                   | Ação executada                                             |
|---------------------------------|------------------------------------------------------------|
| `checkout.session.completed`    | Upsert em `subscriptions` com status `active` e metadados. |
| `invoice.paid`                  | Atualiza `subscriptions.status` para `active` e guarda fatura em `invoices`. |
| `invoice.payment_failed`        | Marca assinatura como `past_due` e persiste a fatura.      |
| `customer.subscription.deleted` | Atualiza `subscriptions` para `canceled`.                  |

Todos os eventos são gravados em `billing_events` para auditoria.

## Billing e feature flags

- `/api/checkout` cria sessões de assinatura e atribui `plan_id` nos metadados.
- O webhook usa o service role do Supabase para sincronizar as tabelas `subscriptions`, `invoices` e `billing_events`.
- A aplicação web lê `user_entitlements.flags` e mescla com os valores `FEATURE_*` definidos em ambiente.
