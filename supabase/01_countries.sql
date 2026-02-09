-- ============================================
-- 1. COUNTRIES TABLE + SEED DATA
-- ============================================

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

alter table public.countries enable row level security;

create policy "Anyone can read countries"
  on public.countries for select
  using (true);
