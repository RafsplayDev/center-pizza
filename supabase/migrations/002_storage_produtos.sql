-- =============================================================
-- Center Pizza · Supabase Storage
-- Bucket para armazenar as imagens dos produtos
-- =============================================================

-- Criar o bucket "produtos" se não existir, e marcá-lo como público
insert into storage.buckets (id, name, public) 
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

-- Políticas de acesso para o bucket "produtos"

-- 1. Permitir leitura pública (qualquer um pode ver as fotos)
create policy "Imagens publicas dos produtos"
  on storage.objects for select
  using ( bucket_id = 'produtos' );

-- 2. Permitir upload/inserção apenas para usuários autenticados (admin)
create policy "Upload de imagens para produtos"
  on storage.objects for insert
  with check ( bucket_id = 'produtos' and auth.role() = 'authenticated' );

-- 3. Permitir atualização apenas para usuários autenticados
create policy "Update de imagens para produtos"
  on storage.objects for update
  using ( bucket_id = 'produtos' and auth.role() = 'authenticated' );

-- 4. Permitir exclusão apenas para usuários autenticados
create policy "Delete de imagens para produtos"
  on storage.objects for delete
  using ( bucket_id = 'produtos' and auth.role() = 'authenticated' );
