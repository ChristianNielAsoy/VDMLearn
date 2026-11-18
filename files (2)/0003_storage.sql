-- Storage bucket for diagrams. Public read is fine ONLY for your own CC0 drawings and properly licensed images.
-- Anything from a non-shareable source must go in a private bucket with signed URLs instead.
insert into storage.buckets (id, name, public)
values ('diagrams', 'diagrams', true)
on conflict (id) do nothing;

create policy diagrams_owner_write on storage.objects for all to authenticated
  using (bucket_id = 'diagrams' and public.current_app_role() = 'owner')
  with check (bucket_id = 'diagrams' and public.current_app_role() = 'owner');
