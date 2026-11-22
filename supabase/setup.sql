-- 달달베이비 커뮤니티 DB 설정
-- Supabase 대시보드 > SQL Editor > New query 에 전체를 붙여넣고 Run 을 누르세요.
-- 여러 번 실행해도 안전하게 만들었어요.

-- 0) 안전장치: 다른 서비스(예: 엄배송)가 쓰는 Supabase 프로젝트에서 실행하면 멈춰요.
--    달달베이비는 반드시 전용 Supabase 프로젝트에서 실행하세요.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='profiles')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='nick') then
    raise exception '이 DB에는 다른 서비스의 profiles 테이블이 있어요. 달달베이비 전용 Supabase 프로젝트를 새로 만들어 거기서 실행하세요.';
  end if;
end $$;

-- 1) 회원 프로필 (닉네임, 아기 개월 수)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nick text not null unique check (char_length(nick) between 2 and 12),
  baby_month int,
  created_at timestamptz not null default now()
);

-- 가입하면 프로필을 자동으로 만들어요 (닉네임은 가입 화면에서 받은 값)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nick, baby_month)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nick'), ''), '엄빠' || substr(new.id::text, 1, 6)),
    nullif(new.raw_user_meta_data->>'baby_month', '')::int
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) 게시글 (free: 자유게시판, qna: 질문답변, market: 사고팔아요)
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  board text not null check (board in ('free','qna','market')),
  title text not null check (char_length(title) between 1 and 60),
  body text not null check (char_length(body) between 1 and 5000),
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  price int check (price is null or price between 0 and 100000000),
  region text check (region is null or char_length(region) <= 30),
  status text not null default 'sale' check (status in ('sale','res','done')),
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists posts_board_created_idx on public.posts (board, created_at desc);

-- 3) 댓글
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- 4) 좋아요 (한 사람이 한 글에 한 번)
create table if not exists public.likes (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- 좋아요 수, 댓글 수를 자동으로 세요
create or replace function public.bump_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'likes' then
    update posts set like_count = like_count + (case when tg_op = 'INSERT' then 1 else -1 end)
      where id = coalesce(new.post_id, old.post_id);
  else
    update posts set comment_count = comment_count + (case when tg_op = 'INSERT' then 1 else -1 end)
      where id = coalesce(new.post_id, old.post_id);
  end if;
  return null;
end $$;

drop trigger if exists likes_count on public.likes;
create trigger likes_count after insert or delete on public.likes
  for each row execute function public.bump_counts();
drop trigger if exists comments_count on public.comments;
create trigger comments_count after insert or delete on public.comments
  for each row execute function public.bump_counts();

-- 5) 보안 규칙 (Row Level Security)
--    누구나 읽을 수 있고, 쓰기/수정/삭제는 로그인한 본인 것만.
alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.comments enable row level security;
alter table public.likes    enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (true);
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert to authenticated
  with check (auth.uid() = author_id);
drop policy if exists "posts update own" on public.posts;
create policy "posts update own" on public.posts for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "posts delete own" on public.posts;
create policy "posts delete own" on public.posts for delete to authenticated
  using (auth.uid() = author_id);

drop policy if exists "comments read" on public.comments;
create policy "comments read" on public.comments for select using (true);
drop policy if exists "comments insert own" on public.comments;
create policy "comments insert own" on public.comments for insert to authenticated
  with check (auth.uid() = author_id);
drop policy if exists "comments delete own" on public.comments;
create policy "comments delete own" on public.comments for delete to authenticated
  using (auth.uid() = author_id);

drop policy if exists "likes read" on public.likes;
create policy "likes read" on public.likes for select using (true);
drop policy if exists "likes insert own" on public.likes;
create policy "likes insert own" on public.likes for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "likes delete own" on public.likes;
create policy "likes delete own" on public.likes for delete to authenticated
  using (auth.uid() = user_id);

-- 좋아요 수·댓글 수·작성자는 직접 고칠 수 없게 막아요 (글 내용과 거래 상태만 수정 가능)
revoke update on public.posts from anon, authenticated;
grant update (title, body, price, region, status) on public.posts to authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (nick, baby_month) on public.profiles to authenticated;
revoke insert, update, delete on public.profiles from anon;
revoke insert, update, delete on public.posts, public.comments, public.likes from anon;
