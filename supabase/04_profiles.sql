-- ============================================
-- 4. PROFILES TABLE + TRIGGER + RLS
-- ============================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'user' check (role in ('user', 'seller', 'admin')),
  full_name text,
  phone text,
  avatar_url text,
  country_id uuid references public.countries(id),
  business_type_id uuid references public.business_types(id),
  badge text default 'standard' check (badge in ('standard','silver','gold','platinum')),
  currency text default 'INR',
  is_verified boolean default false,
  approved boolean default false,
  is_banned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
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

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.get_my_role() = 'admin');

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.get_my_role() = 'admin');
