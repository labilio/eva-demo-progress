alter table public.eva_demo_comments
  drop constraint if exists eva_demo_comments_status_check;

alter table public.eva_demo_comments
  add constraint eva_demo_comments_status_check
  check (status in ('open', 'approved', 'doing', 'done'));

drop policy if exists "reviewers can change comment workflow status" on public.eva_demo_comments;
create policy "reviewers can change comment workflow status"
on public.eva_demo_comments for update
to anon, authenticated
using (true)
with check (status in ('open', 'approved', 'doing', 'done'));
