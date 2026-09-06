alter table public.eva_demo_comments
  drop constraint if exists eva_demo_comments_kind;

alter table public.eva_demo_comments
  drop constraint if exists eva_demo_comments_kind_check;

alter table public.eva_demo_comments
  add constraint eva_demo_comments_kind_check
  check (kind in ('copy', 'ui', 'rebuild', 'function', 'ready', 'issue', 'idea', 'question', 'praise'));
