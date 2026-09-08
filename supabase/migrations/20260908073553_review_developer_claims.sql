-- Shared review attribution, not an authentication or permission system.
alter table public.eva_demo_comments
  add column claimed_by text,
  add column claimed_at timestamptz,
  add constraint eva_comment_claim_pair check (
    (claimed_by is null and claimed_at is null) or
    (claimed_by is not null and char_length(btrim(claimed_by)) between 1 and 40 and claimed_at is not null)
  );
grant update (claimed_by, claimed_at) on public.eva_demo_comments to anon, authenticated;

-- Lock the entire selection in stable order; one conflict aborts the whole batch.
create function public.eva_claim_comments(comment_ids uuid[], actor text, release_claim boolean default false)
returns setof public.eva_demo_comments
language plpgsql security invoker set search_path = '' as $$
declare item public.eva_demo_comments; total integer := 0;
begin
  if coalesce(cardinality(comment_ids),0) not between 1 and 100
     or actor is null or char_length(btrim(actor)) not between 1 and 40 then
    raise exception '请选择 1–100 条批注，并填写 1–40 字的认领者姓名';
  end if;
  if cardinality(comment_ids) <> (select count(distinct id) from unnest(comment_ids) as ids(id)) then
    raise exception '批注 ID 不得重复或为空';
  end if;
  for item in select * from public.eva_demo_comments where id = any(comment_ids) order by id for update loop
    total := total + 1;
    if release_claim then
      if item.claimed_by is distinct from btrim(actor) then
        raise exception '批注 #% 由其他人认领或尚未认领，请核对认领者姓名', item.seq;
      end if;
    elsif item.claimed_by is not null or item.status <> 'approved' then
      raise exception '批注 #% 已被认领或不再是已确认状态，请检查更新', item.seq;
    end if;
  end loop;
  if total <> cardinality(comment_ids) then raise exception '部分批注已删除或不可访问，请检查更新'; end if;
  return query update public.eva_demo_comments
    set claimed_by = case when release_claim then null else btrim(actor) end,
        claimed_at = case when release_claim then null else now() end,
        status = case when release_claim then status else 'doing' end
    where id = any(comment_ids) returning *;
end;
$$;
revoke all on function public.eva_claim_comments(uuid[],text,boolean) from public;
grant execute on function public.eva_claim_comments(uuid[],text,boolean) to anon, authenticated;
