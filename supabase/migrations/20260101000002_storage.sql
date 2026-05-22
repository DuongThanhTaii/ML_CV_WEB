-- =====================================================================
-- Storage buckets and policies
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('datasets', 'datasets', false, 52428800, null),         -- 50 MB
  ('avatars',  'avatars',  true,  2097152,  array['image/png','image/jpeg','image/webp']),
  ('course-covers', 'course-covers', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Datasets: owner-only access; team sharing handled by datasets.is_public flag at row level
create policy "dataset_objects_owner_read" on storage.objects
  for select using (
    bucket_id = 'datasets' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "dataset_objects_owner_write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'datasets' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "dataset_objects_owner_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'datasets' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Avatars are public-read, owner-write
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_owner_write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
