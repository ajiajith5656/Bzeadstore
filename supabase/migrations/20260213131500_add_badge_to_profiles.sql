-- Add badge column to profiles without changing roles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS badge text DEFAULT 'standard' CHECK (badge IN ('standard','silver','gold','platinum'));
