# Operacao 12S

Plataforma web para a Operacao 12S, um entregavel digital de curadoria para indicar o plano alimentar, gerar a trilha da operacao e organizar o ponto de partida do participante.

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

## Fluxo atual do produto

- O participante nao se cadastra sozinho.
- A equipe cria o acesso em um link interno protegido por `SIGNUP_ACCESS_CODE`.
- O participante recebe e-mail e senha pelo WhatsApp.
- Ao entrar, ele acessa anamnese, plano indicado, trilha da operacao e avaliacoes.
- A plataforma nao entrega aulas nem area de membros.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```
