-- ============================================
-- 5. SELLER KYC TABLE + RLS
-- ============================================

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

  -- Business Address (JSONB)
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

create unique index seller_kyc_seller_id_idx on public.seller_kyc (seller_id);

create trigger seller_kyc_updated_at
  before update on public.seller_kyc
  for each row execute function public.update_updated_at();

-- RLS
alter table public.seller_kyc enable row level security;

create policy "Sellers can read own KYC"
  on public.seller_kyc for select
  using (auth.uid() = seller_id);

create policy "Sellers can insert own KYC"
  on public.seller_kyc for insert
  with check (auth.uid() = seller_id);

create policy "Sellers can update own KYC"
  on public.seller_kyc for update
  using (auth.uid() = seller_id and kyc_status in ('draft', 'rejected'));

create policy "Admins can read all KYC"
  on public.seller_kyc for select
  using (public.get_my_role() = 'admin');

create policy "Admins can update all KYC"
  on public.seller_kyc for update
  using (public.get_my_role() = 'admin');

create policy "Admins can delete KYC"
  on public.seller_kyc for delete
  using (public.get_my_role() = 'admin');
