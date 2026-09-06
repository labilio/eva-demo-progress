drop policy if exists "reviewers can change comment workflow status" on public.eva_demo_comments;
create policy "reviewers can change comment workflow status"
on public.eva_demo_comments for update
to anon, authenticated
using (true)
with check (status in ('open', 'approved', 'doing'));
