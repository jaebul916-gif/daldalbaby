-- 카카오 로그인용 업데이트 (이미 setup.sql 을 실행한 달달베이비 DB에서 한 번만 실행하세요)
-- Supabase 대시보드 > SQL Editor > New query 에 붙여넣고 Run.
-- 여러 번 실행해도 괜찮아요. 테이블이나 기존 회원 데이터는 바뀌지 않아요.

-- 가입하면 프로필을 자동으로 만들어요.
-- 이메일 가입은 가입 화면의 닉네임, 카카오 가입은 카카오 닉네임을 써요(이메일이 없어도 돼요).
-- 닉네임이 12자를 넘으면 자르고, 2자보다 짧거나 없으면 '엄빠+숫자'로, 이미 있으면 뒤에 숫자를 붙여요.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base text;
  cand text;
  n int := 1;
begin
  base := regexp_replace(trim(coalesce(
    nullif(trim(m->>'nick'), ''), nullif(trim(m->>'nickname'), ''), nullif(trim(m->>'name'), ''),
    nullif(trim(m->>'full_name'), ''), nullif(trim(m->>'preferred_username'), ''), nullif(trim(m->>'user_name'), ''),
    '')), '\s+', ' ', 'g');
  base := trim(left(base, 12));
  if char_length(base) < 2 then base := '엄빠' || substr(replace(new.id::text, '-', ''), 1, 6); end if;
  cand := base;
  while exists (select 1 from public.profiles where nick = cand) loop
    n := n + 1;
    if n > 30 then cand := left(base, 5) || substr(md5(random()::text), 1, 6); exit; end if;
    cand := left(base, 12 - char_length(n::text)) || n::text;
  end loop;
  insert into public.profiles (id, nick, baby_month)
  values (new.id, cand, case when m->>'baby_month' ~ '^-?[0-9]+$' then (m->>'baby_month')::int end)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
