# Deploy do SuperPlanejador

Este guia resume as variáveis de ambiente, execução local e implantação nas funções serverless da Vercel.

## Variáveis de ambiente

Defina as chaves abaixo em `.env` (local) e no painel da Vercel:

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: credenciais públicas do Supabase.
- `GROQ_API_KEY`: chave usada pela rota `/api/ai-hints` (opcional se o recurso estiver desativado).
- Flags padrão: `FEATURE_OPEN_FINANCE`, `FEATURE_CARDS_MODULE`, `FEATURE_CATEGORY_LIMITS`, `FEATURE_GOALS`,
  `FEATURE_CASH_FORECAST`, `FEATURE_REPORTS`, `FEATURE_EXPORTS`, `FEATURE_MULTI_PROFILE`.

## Execução local

1. Instale as dependências com `npm install`.
2. Crie um arquivo `.env` copiando de `.env.example` e ajuste as chaves locais.
3. Rode `npm run dev` para iniciar o Vite e `vercel dev` para exercitar as rotas `/api` quando necessário.

## Implantação na Vercel

- As funções serverless residem em `/api`. Ao fazer deploy pela Vercel, elas são publicadas automaticamente.
- Configure as variáveis acima no projeto Vercel.
