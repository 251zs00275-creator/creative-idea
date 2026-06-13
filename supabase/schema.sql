-- ============================================================
-- Creative Sense Archive — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- users
-- ============================================================
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  display_name    text,
  created_at      timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Auto-create user row on sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- works
-- ============================================================
create table if not exists public.works (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  title           text not null,
  category        text not null check (category in ('movie','anime','illustration','photo','music','design','other')),
  url             text,
  thumbnail_url   text,
  memo            text,
  framework       text check (framework in ('vts','orid','element','self')),
  ws_answers      jsonb,
  created_at      timestamptz default now()
);

alter table public.works enable row level security;

create policy "Users can CRUD own works"
  on public.works for all
  using (auth.uid() = user_id);

-- Index for listing/filtering
create index if not exists works_user_id_created_at
  on public.works (user_id, created_at desc);
create index if not exists works_category
  on public.works (user_id, category);
create index if not exists works_framework
  on public.works (user_id, framework);

-- Full-text search
create index if not exists works_fts
  on public.works using gin(to_tsvector('japanese', coalesce(title,'') || ' ' || coalesce(memo,'')));

-- ============================================================
-- ai_chat_logs
-- ============================================================
create table if not exists public.ai_chat_logs (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.works(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz default now()
);

alter table public.ai_chat_logs enable row level security;

create policy "Users can CRUD own chat logs"
  on public.ai_chat_logs for all
  using (
    auth.uid() = (
      select user_id from public.works where id = work_id
    )
  );

create index if not exists ai_chat_logs_work_id
  on public.ai_chat_logs (work_id, created_at asc);

-- ============================================================
-- analyses
-- ============================================================
create table if not exists public.analyses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  aesthetic    text,
  values       text,
  pattern      text,
  keywords     text[],
  works_count  int,
  created_at   timestamptz default now()
);

alter table public.analyses enable row level security;

create policy "Users can CRUD own analyses"
  on public.analyses for all
  using (auth.uid() = user_id);
