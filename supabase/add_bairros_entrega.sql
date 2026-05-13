-- =============================================================
-- Center Pizza · Áreas de Entrega por Bairro
-- Execute este SQL no Supabase SQL Editor
-- =============================================================

-- Tabela de bairros de entrega
CREATE TABLE IF NOT EXISTS bairros_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  tempo_estimado INTEGER DEFAULT 45,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE bairros_entrega ENABLE ROW LEVEL SECURITY;

-- Política pública de leitura (para o app do cliente)
CREATE POLICY "Bairros visíveis para todos"
  ON bairros_entrega FOR SELECT
  USING (true);

-- Política de escrita para usuários autenticados (admin)
CREATE POLICY "Admin pode gerenciar bairros"
  ON bairros_entrega FOR ALL
  USING (true)
  WITH CHECK (true);

-- Adicionar campo de modo de entrega nas configurações
-- 'raio' = por distância (km), 'bairro' = por bairro cadastrado
ALTER TABLE configuracoes
  ADD COLUMN IF NOT EXISTS modo_entrega TEXT NOT NULL DEFAULT 'raio';
