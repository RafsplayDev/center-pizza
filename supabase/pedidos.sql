CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido SERIAL,
    cliente_nome TEXT NOT NULL,
    cliente_telefone TEXT NOT NULL,
    tipo_entrega TEXT NOT NULL, -- 'entrega' ou 'retirada'
    endereco_entrega TEXT, -- Ex: Rua, número, bairro
    taxa_entrega NUMERIC DEFAULT 0,
    subtotal NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    metodo_pagamento TEXT NOT NULL, -- 'pix', 'dinheiro', 'cartao'
    troco_para NUMERIC,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, aceito, preparo, entrega, concluido
    itens JSONB NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security) se necessário
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso anônimo (cliente criando pedido)
CREATE POLICY "Permitir inserção anônima em pedidos" 
ON pedidos FOR INSERT 
TO public 
WITH CHECK (true);

-- Política para leitura/atualização (admin)
-- Ajuste de acordo com a regra de autenticação do seu painel
CREATE POLICY "Permitir leitura para todos (ou admin)" 
ON pedidos FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Permitir atualização para todos (ou admin)" 
ON pedidos FOR UPDATE
TO public 
USING (true);
