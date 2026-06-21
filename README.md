# Operacao 12S

Plataforma web para a Operacao 12S, um programa digital de emagrecimento guiado por 12 semanas com acesso por 1 ano.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- React Hook Form
- Zod
- Vitest

## Rodar localmente

```bash
npm install
npm run dev
```

Crie `.env.local` com as variaveis do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-public
SUPABASE_SECRET_KEY=sua-chave-secret-apenas-server-side
SIGNUP_ACCESS_CODE=um-codigo-privado-para-o-link-de-cadastro
```

## Banco de dados

A migration inicial esta em:

```txt
supabase/migrations/20260621114500_initial_schema.sql
```

Para aplicar manualmente no painel do Supabase, rode o arquivo pelo SQL Editor.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```
