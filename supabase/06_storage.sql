-- ============================================
-- 6. KYC DOCUMENTS STORAGE BUCKET + RLS
-- ============================================

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false);

-- Sellers upload to their own folder
create policy "Sellers can upload own KYC docs"
  on storage.objects for insert
  with check (
    bucket_id = 'kyc-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Sellers read their own docs
create policy "Sellers can read own KYC docs"
  on storage.objects for select
  using (
    bucket_id = 'kyc-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins read all docs
create policy "Admins can read all KYC docs"
  on storage.objects for select
  using (
    bucket_id = 'kyc-documents'
    and public.get_my_role() = 'admin'
  );
