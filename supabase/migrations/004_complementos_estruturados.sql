-- =============================================================
-- Center Pizza · Tabelas de Complementos (Simples e Múltiplos)
-- =============================================================

-- Remover a tabela antiga se existir para recriar com a nova estrutura
drop table if exists complementos cascade;

-- Tabela principal de complementos
create table if not exists complementos (
  id uuid default gen_random_uuid() primary key,
  produto_id uuid references produtos(id) on delete cascade,
  nome text not null,
  descricao text default '',
  tipo text not null check (tipo in ('simples', 'multiplo')),
  
  -- Campos para o tipo "simples"
  valor numeric(10,2) default 0,
  
  -- Campos para o tipo "múltiplo"
  min_opcoes int default 0,
  max_opcoes int default 1,
  
  posicao int not null default 0,
  created_at timestamptz default now()
);

-- Tabela para as opções dos complementos múltiplos
create table if not exists complemento_opcoes (
  id uuid default gen_random_uuid() primary key,
  complemento_id uuid not null references complementos(id) on delete cascade,
  nome text not null,
  valor numeric(10,2) default 0,
  posicao int not null default 0,
  created_at timestamptz default now()
);

-- RLS
alter table complementos enable row level security;
alter table complemento_opcoes enable row level security;

create policy "Autenticados gerenciam complementos" on complementos for all using (true) with check (true);
create policy "Autenticados gerenciam opcoes de complementos" on complemento_opcoes for all using (true) with check (true);
