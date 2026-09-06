grant delete on public.eva_demo_comments to anon, authenticated;

drop policy if exists "reviewers can delete shared comments" on public.eva_demo_comments;
create policy "reviewers can delete shared comments"
on public.eva_demo_comments
for delete
to anon, authenticated
using (true);
