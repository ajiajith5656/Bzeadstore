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

-- Helper function to get current user's role (bypasses RLS)
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can read all profiles (uses helper to avoid recursion)
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.get_my_role() = 'admin');

-- Admins can update all profiles
create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.get_my_role() = 'admin');

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

-- 7. SELLER KYC TABLE
create table public.seller_kyc (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references auth.users(id) on delete cascade not null,

  -- Pre-filled from signup
  email text not null,
  phone text,
  full_name text,
  country text,

  -- Tax & Business Information
  pan text,
  gstin text,

  -- Identity Verification
  id_type text check (id_type in ('aadhar', 'passport', 'voter', 'driver_license')),
  id_number text,
  id_document_url text,

  -- Business Address (stored as JSONB)
  business_address jsonb,
  address_proof_url text,

  -- Bank Details
  bank_holder_name text,
  account_number text,
  account_type text check (account_type in ('checking', 'savings', 'current')),
  ifsc_code text,
  bank_statement_url text,

  -- Compliance & Legal
  pep_declaration boolean default false,
  sanctions_check boolean default false,
  aml_compliance boolean default false,
  tax_compliance boolean default false,
  terms_accepted boolean default false,

  -- KYC Status & Metadata
  kyc_status text default 'draft' check (kyc_status in ('draft', 'pending', 'approved', 'rejected')),
  kyc_tier int default 2,
  rejection_reason text,
  verified_by_admin uuid references auth.users(id),
  verified_at timestamptz,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  submitted_at timestamptz
);

-- Unique constraint: one KYC per seller
create unique index seller_kyc_seller_id_idx on public.seller_kyc (seller_id);

-- Auto-update updated_at
create trigger seller_kyc_updated_at
  before update on public.seller_kyc
  for each row execute function public.update_updated_at();

-- RLS for seller_kyc
alter table public.seller_kyc enable row level security;

-- Sellers can read their own KYC
create policy "Sellers can read own KYC"
  on public.seller_kyc for select
  using (auth.uid() = seller_id);

-- Sellers can insert their own KYC
create policy "Sellers can insert own KYC"
  on public.seller_kyc for insert
  with check (auth.uid() = seller_id);

-- Sellers can update their own KYC (only if not yet approved)
create policy "Sellers can update own KYC"
  on public.seller_kyc for update
  using (auth.uid() = seller_id and kyc_status in ('draft', 'rejected'));

-- Admins can read all KYC records
create policy "Admins can read all KYC"
  on public.seller_kyc for select
  using (public.get_my_role() = 'admin');

-- Admins can update all KYC records (approve/reject)
create policy "Admins can update all KYC"
  on public.seller_kyc for update
  using (public.get_my_role() = 'admin');

-- 8. SELLER KYC DOCUMENTS STORAGE BUCKET
-- Run these via Supabase SQL editor or Dashboard:
--
--   insert into storage.buckets (id, name, public)
--   values ('kyc-documents', 'kyc-documents', false);
--
--   -- Allow authenticated sellers to upload to their own folder
--   create policy "Sellers can upload own KYC docs"
--     on storage.objects for insert
--     with check (
--       bucket_id = 'kyc-documents'
--       and auth.uid()::text = (storage.foldername(name))[1]
--     );
--
--   -- Allow sellers to read their own KYC docs
--   create policy "Sellers can read own KYC docs"
--     on storage.objects for select
--     using (
--       bucket_id = 'kyc-documents'
--       and auth.uid()::text = (storage.foldername(name))[1]
--     );
--
--   -- Allow admins to read all KYC docs
--   create policy "Admins can read all KYC docs"
--     on storage.objects for select
--     using (
--       bucket_id = 'kyc-documents'
--       and public.get_my_role() = 'admin'
--     );

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
