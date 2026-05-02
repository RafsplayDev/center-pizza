-- =============================================================
-- Center Pizza · Configurações da Loja
-- Tabela para armazenar o status de funcionamento
-- =============================================================

CREATE TABLE IF NOT EXISTS configuracoes (
  id TEXT PRIMARY KEY DEFAULT 'loja',
  aberta BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir o status inicial se não existir
INSERT INTO configuracoes (id, aberta)
VALUES ('loja', true)
ON CONFLICT (id) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE configuracoes IS 'Configurações globais do sistema';
COMMENT ON COLUMN configuracoes.aberta IS 'Indica se a loja está aberta para receber pedidos';
