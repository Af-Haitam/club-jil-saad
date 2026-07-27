-- ═══════════════════════════════════════════════════════════════════════
-- 0007 — تنبيهات التطبيق الأصيل (FCM)
--
-- لا عمود جديد ولا جدول: `push_tokens.platform` من نوع push_platform
-- ('web','android','ios') منذ 0001، فرمز أندرويد الأصيل يجلس بجانب رموز
-- المتصفّح في الجدول نفسه ويتميّز بقيمته.
--
-- المطلوب هنا شيء واحد: **طريق كتابة آمن من الهاتف**.
--
-- رمز الدفع يخصّ **جهازًا** لا شخصًا. وعلى هاتفٍ يتناوب عليه أخوان، يسجّل
-- الثاني دخوله فيجد الرمز نفسه مملوكًا للأوّل. عمود `token` فريد، وRLS
-- تمنع الكتابة على صفّ عضوٍ آخر — فتفشل المحاولة صامتةً، ويبقى الأوّل
-- يتلقّى تنبيهات على جهازٍ لم يعد له. هذه بالضبط العلّة التي اكتُشفت على
-- هاتفٍ حقيقيّ في المرحلة ٧، وعولجت في الويب بمفتاح الخدمة من الخادم.
--
-- والتطبيق لا يملك مفتاح خدمة ولن يملكه أبدًا. فالحلّ دالّة SECURITY
-- DEFINER تنتزع الرمز لصاحب الجلسة الحالية — لا تقبل معرّف مستخدم من
-- الخارج، بل تقرأ auth.uid() بنفسها، فلا يستطيع أحد أن ينتحل غيره.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.claim_push_token(
  p_token    text,
  p_platform public.push_platform
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'token required';
  end if;

  -- ينتزع الجهاز من مالكه السابق إن وُجد
  delete from public.push_tokens
   where token = p_token
     and user_id <> auth.uid();

  insert into public.push_tokens (user_id, token, platform, last_used_at)
  values (auth.uid(), p_token, p_platform, now())
  on conflict (token) do update
    set user_id      = excluded.user_id,
        platform     = excluded.platform,
        last_used_at = now();
end;
$$;

-- تسجيل الخروج من التطبيق يجب أن يُسكت الجهاز فورًا، وإلّا بقي يستقبل
-- تنبيهات حسابٍ غادر.
create or replace function public.release_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  delete from public.push_tokens
   where token = p_token
     and user_id = auth.uid();
end;
$$;

revoke all on function public.claim_push_token(text, public.push_platform) from public, anon;
revoke all on function public.release_push_token(text) from public, anon;
grant execute on function public.claim_push_token(text, public.push_platform) to authenticated;
grant execute on function public.release_push_token(text) to authenticated;

-- يسأل عنه التطبيق ليعرف أمُفعَّلة التنبيهات على هذا الجهاز لهذا الحساب أم
-- لا. `select` على push_tokens مسموحٌ لصاحب الصفّ وحده، فالسؤال آمن ولا
-- يكشف شيئًا عن غيره.
comment on function public.claim_push_token(text, public.push_platform) is
  'يسجّل رمز دفع الجهاز لصاحب الجلسة، وينتزعه من مالكٍ سابق على الجهاز نفسه';
