alter table public.eva_demo_comments
  drop constraint if exists eva_demo_comments_status_check;

alter table public.eva_demo_comments
  add constraint eva_demo_comments_status_check
  check (status in ('open', 'approved', 'doing', 'ready'));

drop policy if exists "eva demo comments accept valid submissions" on public.eva_demo_comments;
create policy "eva demo comments accept valid submissions"
on public.eva_demo_comments for insert
to anon, authenticated
with check (
  char_length(author_name) between 2 and 40
  and char_length(body) between 1 and 2000
  and char_length(page_path) between 1 and 500
  and kind in ('copy', 'ui', 'rebuild', 'function')
  and status in ('open', 'ready')
);

drop policy if exists "reviewers can change comment workflow status" on public.eva_demo_comments;
create policy "reviewers can change comment workflow status"
on public.eva_demo_comments for update
to anon, authenticated
using (true)
with check (status in ('open', 'approved', 'doing', 'ready'));
