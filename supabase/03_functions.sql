-- ============================================
-- 3. HELPER FUNCTIONS (shared triggers & utils)
-- ============================================

-- Auto-update updated_at on any table that uses this trigger
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Helper: get current user's role (bypasses RLS, avoids recursion)
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;
