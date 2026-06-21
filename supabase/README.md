# Supabase - Operacao 12S

Esta pasta guarda as migrations versionaveis do banco.

## Primeira aplicacao

1. Abra o painel do Supabase.
2. Va em SQL Editor.
3. Rode o arquivo `supabase/migrations/20260621114500_initial_schema.sql`.
4. No projeto local, crie `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-public
```

## Papel de admin

Depois de criar seu usuario pelo cadastro da plataforma, promova ele para admin:

```sql
update public.profiles
set role = 'admin',
    access_status = 'ativo',
    access_starts_at = now(),
    access_expires_at = now() + interval '1 year'
where email = 'seu-email@exemplo.com';
```

## Observacao de seguranca

Participantes acessam apenas os proprios dados. Admins acessam todos os dados pelo helper `public.is_admin()`.

## Escopo atual

O fluxo atual da Operacao 12S nao usa aulas, modulos ou bonus. Algumas tabelas foram criadas na migration inicial por causa do backlog antigo, mas nao fazem parte da experiencia atual do participante.
