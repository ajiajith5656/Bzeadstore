-- ============================================
-- 2. BUSINESS TYPES TABLE + SEED DATA
-- ============================================

create table public.business_types (
  id uuid default gen_random_uuid() primary key,
  type_name text not null unique,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into public.business_types (type_name, description) values
  ('Individual',  'Solo seller or sole proprietor'),
  ('Brand',       'Registered brand or company'),
  ('Freelancing', 'Freelance seller or creator');

alter table public.business_types enable row level security;

create policy "Anyone can read business types"
  on public.business_types for select
  using (true);
