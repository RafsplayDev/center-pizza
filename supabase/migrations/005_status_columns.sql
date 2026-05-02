-- =============================================================
-- Center Pizza · Atualização de Status (Categorias e Produtos)
-- =============================================================

-- Garantir que a coluna 'ativa' existe na tabela de categorias
ALTER TABLE categorias 
ADD COLUMN IF NOT EXISTS ativa BOOLEAN NOT NULL DEFAULT true;

-- Garantir que a coluna 'visivel' existe na tabela de produtos
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS visivel BOOLEAN NOT NULL DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN categorias.ativa IS 'Indica se a categoria está ativa e deve ser exibida no cardápio';
COMMENT ON COLUMN produtos.visivel IS 'Indica se o produto está visível para os clientes';
