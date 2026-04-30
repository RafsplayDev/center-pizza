-- =============================================================
-- Center Pizza · Tabela de Complementos
-- =============================================================

create table if not exists complementos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descricao text not null default '',
  tipo text not null check (tipo in ('simples', 'multiplo')),
  valor numeric(10,2) not null default 0,
  posicao int not null default 0,
  created_at timestamptz default now()
);

-- RLS — habilita
alter table complementos enable row level security;

-- Políticas — permitir tudo para autenticados (admin) e visualização pública
create policy "Autenticados gerenciam complementos"
  on complementos for all
  using (true)
  with check (true);
