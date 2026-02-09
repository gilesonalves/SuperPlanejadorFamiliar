# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/4cbe48e4-069f-4670-ac9b-0c842b28ba76

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4cbe48e4-069f-4670-ac9b-0c842b28ba76) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Environment configuration

Set the following variables locally (`.env`) and in Vercel before building:

- `VITE_SUPABASE_URL` = `https://<SEU-PROJ>.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `<anon key>`
- `VITE_APP_ORIGIN` = `http://localhost:8080` (opcional para desenvolvimento)

> Nunca aponte `VITE_SUPABASE_URL` para `https://app.heygar.com.br`; essa URL é a origem do frontend, não do Supabase.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4cbe48e4-069f-4670-ac9b-0c842b28ba76) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Garantindo UTF-8 em todo o projeto

Para evitar problemas de mojibake (caracteres como `Ã`, `Â` ou o caractere de substituição `U+FFFD`) mantenha toda a cadeia em UTF-8:

- Os arquivos HTML já declaram `<meta charset="utf-8" />` como primeira tag do `<head>`.
- Os servers (Vite em desenvolvimento e as serverless em `api/*`) enviam `Content-Type` com `charset=utf-8` para respostas HTML e JSON.
- Todos os arquivos `.ts`, `.tsx`, `.js`, `.json`, `.md`, `.html` e `.env` devem ser salvos em UTF-8 **sem BOM**. No VS Code use `File > Save with Encoding > UTF-8`.
- Execute `npm run check:utf8` para verificar se há sequências típicas de mojibake (`U+FFFD`, `Ã`, `Â`, `&amp;Atilde;`, etc.). O comando falha se encontrar problemas.
- Garanta que o banco/Supabase esteja configurado com `SHOW server_encoding;` retornando `UTF8` e evite funções que convertam para latin1 (ex.: `convert_from(..., 'latin1')`).

Ao receber texto de APIs/fetch, mantenha o `TextDecoder` padrão (`utf-8`) e não force `latin1`.
