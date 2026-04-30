-- =============================================================
-- Center Pizza · Tabelas do Cardápio
-- Categorias e Produtos
-- =============================================================

-- Categorias
create table if not exists categorias (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descricao text not null default '',
  posicao int not null default 0,
  ativa boolean not null default true,
  created_at timestamptz default now()
);

-- Produtos
create table if not exists produtos (
  id uuid default gen_random_uuid() primary key,
  categoria_id uuid not null references categorias(id) on delete cascade,
  nome text not null,
  descricao text not null default '',
  preco_venda numeric(10,2) not null,
  preco_original numeric(10,2),
  imagem_url text,
  visivel boolean not null default true,
  posicao int not null default 0,
  created_at timestamptz default now()
);

-- RLS — habilita
alter table categorias enable row level security;
alter table produtos enable row level security;

-- Políticas — permitir tudo para autenticados (admin)
create policy "Autenticados gerenciam categorias"
  on categorias for all
  using (true)
  with check (true);

create policy "Autenticados gerenciam produtos"
  on produtos for all
  using (true)
  with check (true);
