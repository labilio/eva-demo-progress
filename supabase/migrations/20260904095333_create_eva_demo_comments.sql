create extension if not exists pgcrypto;

create table public.eva_demo_comments (
  id uuid primary key default gen_random_uuid(),
  client_nonce uuid not null unique,
  page_path text not null,
  anchor jsonb not null default '{}'::jsonb,
  author_name text not null,
  body text not null,
  kind text not null default 'issue',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint eva_demo_comments_author_name_length check (char_length(author_name) between 2 and 40),
  constraint eva_demo_comments_body_length check (char_length(body) between 1 and 2000),
  constraint eva_demo_comments_page_path_length check (char_length(page_path) between 1 and 500),
  constraint eva_demo_comments_kind check (kind in ('issue', 'idea', 'question', 'praise')),
  constraint eva_demo_comments_status check (status in ('open', 'resolved'))
);

alter table public.eva_demo_comments enable row level security;

revoke all on public.eva_demo_comments from anon, authenticated;
grant select, insert on public.eva_demo_comments to anon, authenticated;

create policy "eva demo comments are readable"
on public.eva_demo_comments for select
to anon, authenticated
using (true);

create policy "eva demo comments accept valid submissions"
on public.eva_demo_comments for insert
to anon, authenticated
with check (
  char_length(author_name) between 2 and 40
  and char_length(body) between 1 and 2000
  and char_length(page_path) between 1 and 500
  and kind in ('issue', 'idea', 'question', 'praise')
  and status = 'open'
);
