-- ═══════════════════════════════════════════════════════
-- Rinse — Initial Schema
-- ═══════════════════════════════════════════════════════

-- 1. Profiles table (extends Supabase Auth users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Usage tracking table
create table if not exists public.usage (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  ip_address inet,
  tool text not null,
  file_size_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.usage enable row level security;

create policy "Users can view own usage"
  on public.usage for select
  using (auth.uid() = user_id);

-- Index for fast usage-per-hour lookups
create index idx_usage_user_created on public.usage (user_id, created_at desc);
create index idx_usage_ip_created on public.usage (ip_address, created_at desc);


-- 3. Processed files table (tracks temp files for auto-delete)
create table if not exists public.processed_files (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  original_name text,
  tool text not null,
  expires_at timestamptz not null default (now() + interval '2 hours'),
  created_at timestamptz not null default now()
);

alter table public.processed_files enable row level security;

create policy "Users can view own files"
  on public.processed_files for select
  using (auth.uid() = user_id);

-- Index for cleanup cron
create index idx_files_expires on public.processed_files (expires_at);
