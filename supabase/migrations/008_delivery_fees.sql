-- =============================================================
-- Center Pizza · Delivery Fees and Store Address
-- Adiciona campos de endereço e tabela de taxas por distância
-- =============================================================

-- Adicionar campos de endereço da pizzaria na tabela de configurações
ALTER TABLE configuracoes 
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Criar tabela de taxas de entrega por distância
CREATE TABLE IF NOT EXISTS taxas_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distancia_min NUMERIC NOT NULL, -- em km
  distancia_max NUMERIC NOT NULL, -- em km
  valor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(distancia_min, distancia_max)
);

-- Comentários
COMMENT ON TABLE taxas_entrega IS 'Tabela de taxas de entrega baseadas em faixas de distância';
COMMENT ON COLUMN taxas_entrega.distancia_min IS 'Distância mínima da faixa em quilômetros';
COMMENT ON COLUMN taxas_entrega.distancia_max IS 'Distância máxima da faixa em quilômetros';
COMMENT ON COLUMN taxas_entrega.valor IS 'Valor da taxa de entrega para esta faixa';

-- Garantir que a configuração da loja exista
INSERT INTO configuracoes (id, aberta)
VALUES ('loja', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- RLS (Row Level Security)
-- =============================================================

-- Políticas para taxas_entrega
ALTER TABLE taxas_entrega ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público para leitura de taxas"
ON taxas_entrega FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin pode gerenciar taxas"
ON taxas_entrega FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para configuracoes (ajuste se necessário)
-- Assumindo que a tabela configuracoes já tem RLS, vamos garantir as permissões de escrita para o admin
CREATE POLICY "Admin pode atualizar configuracoes"
ON configuracoes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
