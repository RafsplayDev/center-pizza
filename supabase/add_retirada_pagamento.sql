-- Adicionar campos de retirada e formas de pagamento na tabela configuracoes
ALTER TABLE configuracoes 
  ADD COLUMN IF NOT EXISTS retirada_ativa BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS formas_pagamento_entrega JSONB NOT NULL DEFAULT '["pix", "cartao", "dinheiro"]';

-- Garantir que a coluna modo_entrega exista (caso não tenha sido criada antes)
ALTER TABLE configuracoes 
  ADD COLUMN IF NOT EXISTS modo_entrega TEXT NOT NULL DEFAULT 'raio';

-- Adicionar campo ativo nas taxas de entrega
ALTER TABLE taxas_entrega
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;
