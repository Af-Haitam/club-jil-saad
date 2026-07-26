-- ═══════════════════════════════════════════════════════════════════════
--  0006 — صورة الإعلان تصل إلى الصندوق والهاتف
--
--  الصورة كانت تتوقّف عند صفّ announcements: الدالة تنسخ العنوان والنصّ
--  فقط، وnotifications بلا عمود لها أصلًا. فمهما رفع المدير صورةً لم
--  يرها أحد — لا في الصندوق ولا في تنبيه الهاتف.
--
--  طبّقه مرّة واحدة في Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.notifications
  add column if not exists image_url text;

-- الدالة نفسها من 0005، مضافًا إليها image_url. تُستبدل بالكامل لأن
-- create or replace لا يقبل تغيير قائمة الأعمدة المُدرَجة جزئيًّا.
create or replace function public.fanout_notification(p_kind text, p_target uuid)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  src   record;
  admin boolean := public.is_admin();
begin
  if not (admin or public.is_supervisor()) then
    raise exception 'fanout_notification: caller is not staff';
  end if;

  if p_kind = 'announcement' then
    select a.title, a.body, a.image_url, a.audience_type, a.halaqa_id, a.member_id, a.author_id
      into src from public.announcements a where a.id = p_target;
  elsif p_kind = 'reminder' then
    select r.title, r.body, r.image_url, r.audience_type, r.halaqa_id, r.member_id, r.author_id
      into src from public.reminders r where r.id = p_target;
  else
    raise exception 'fanout_notification: unknown kind %', p_kind;
  end if;

  if not found then
    return;
  end if;

  -- المشرف لا يبثّ للنادي كلّه: حلقته أو أحد طلابه فقط.
  if not admin then
    if src.audience_type = 'halaqa' then
      if not exists (select 1 from public.halaqat h
                     where h.id = src.halaqa_id and h.supervisor_id = auth.uid()) then
        raise exception 'fanout_notification: not your halaqa';
      end if;
    elsif src.audience_type = 'member' then
      if not public.supervises(src.member_id) then
        raise exception 'fanout_notification: not your student';
      end if;
    else
      raise exception 'fanout_notification: audience % not allowed for a supervisor',
                      src.audience_type;
    end if;
  end if;

  return query
  with inserted as (
    insert into public.notifications
      (user_id, kind, announcement_id, reminder_id, title, body, image_url, url)
    select
      p.id,
      case when p_kind = 'reminder' then 'reminder' else 'announcement' end,
      case when p_kind = 'announcement' then p_target end,
      case when p_kind = 'reminder'     then p_target end,
      src.title,
      src.body,
      src.image_url,
      '/dashboard/inbox'
    from public.profiles p
    where p.status = 'active'
      -- الكاتب لا يُشعر نفسه برسالته
      and (src.author_id is null or p.id <> src.author_id)
      and (
        (src.audience_type = 'both')
        or (src.audience_type = 'hifz'   and p.in_hifz)
        or (src.audience_type = 'club'   and p.in_club)
        or (src.audience_type = 'member' and p.id = src.member_id)
        or (src.audience_type = 'halaqa' and exists (
              select 1 from public.enrollments e
              where e.member_id = p.id and e.halaqa_id = src.halaqa_id and e.active))
      )
    on conflict do nothing
    returning user_id
  )
  select inserted.user_id from inserted;
end;
$$;

grant execute on function public.fanout_notification(text, uuid) to authenticated;
