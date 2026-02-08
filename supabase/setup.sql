-- ============================================
-- Beauzead Supabase Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. COUNTRIES TABLE
create table public.countries (
  id uuid default gen_random_uuid() primary key,
  country_name text not null unique,
  country_code char(2) not null unique,       -- ISO 3166-1 alpha-2
  short_code char(3) not null unique,         -- ISO 3166-1 alpha-3
  currency_code char(3) not null,             -- ISO 4217
  dialing_code text not null,                 -- e.g. +91
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Seed countries
insert into public.countries (country_name, country_code, short_code, currency_code, dialing_code) values
  ('India',          'IN', 'IND', 'INR', '+91'),
  ('United States',  'US', 'USA', 'USD', '+1'),
  ('United Kingdom', 'GB', 'GBR', 'GBP', '+44'),
  ('Canada',         'CA', 'CAN', 'CAD', '+1'),
  ('Australia',      'AU', 'AUS', 'AUD', '+61'),
  ('Germany',        'DE', 'DEU', 'EUR', '+49'),
  ('France',         'FR', 'FRA', 'EUR', '+33'),
  ('Japan',          'JP', 'JPN', 'JPY', '+81'),
  ('Singapore',      'SG', 'SGP', 'SGD', '+65'),
  ('UAE',            'AE', 'ARE', 'AED', '+971');

-- 2. BUSINESS TYPES TABLE
create table public.business_types (
  id uuid default gen_random_uuid() primary key,
  type_name text not null unique,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Seed business types
insert into public.business_types (type_name, description) values
  ('Individual',  'Solo seller or sole proprietor'),
  ('Brand',       'Registered brand or company'),
  ('Freelancing', 'Freelance seller or creator');

-- 3. PROFILES TABLE (linked to Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'user' check (role in ('user', 'seller', 'admin')),
  full_name text,
  phone text,
  avatar_url text,
  country_id uuid references public.countries(id),
  business_type_id uuid references public.business_types(id),
  currency text default 'INR',
  is_verified boolean default false,
  approved boolean default false,
  is_banned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. AUTO-CREATE PROFILE ON SIGNUP (trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, full_name, phone, currency)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'user'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'currency', 'INR')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. AUTO-UPDATE updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- 6. ROW LEVEL SECURITY (RLS)

-- Profiles
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (but not role)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

-- Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Admins can update all profiles
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Countries: public read
alter table public.countries enable row level security;

create policy "Anyone can read countries"
  on public.countries for select
  using (true);

-- Business types: public read
alter table public.business_types enable row level security;

create policy "Anyone can read business types"
  on public.business_types for select
  using (true);

-- ============================================
-- ADMIN CREATION (run once, replace values)
-- ============================================
-- 
-- Step 1: Create admin user in Supabase Dashboard > Authentication > Users > Add User
--   Email: admin@beauzead.store
--   Password: YourSecurePassword123!
--   Auto Confirm: ON
--
-- Step 2: Get the user's UUID from the dashboard, then run:
--   update public.profiles set role = 'admin' where id = 'UUID_HERE';
--
-- OR use Supabase Admin API:
--   const { data } = await supabase.auth.admin.createUser({
--     email: 'admin@beauzead.store',
--     password: 'YourSecurePassword123!',
--     email_confirm: true,
--     user_metadata: { role: 'admin', full_name: 'Admin' }
--   });
-- ============================================
