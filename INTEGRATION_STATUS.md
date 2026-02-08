# Integration Status

## Auth Integration — DONE
Supabase auth with email/password signup, OTP verification, and session management.
Countries fetched from `countries` table; `country_id` stored in profile after OTP confirmation.
Sign-in fetches profile via `profiles` table with RLS; password reset via Supabase OTP flow.

## User Profile Integration — DONE
Profile page fetches and updates `full_name`, `email`, `phone`, `country_id` (joined with `countries` table) and password directly from Supabase.
