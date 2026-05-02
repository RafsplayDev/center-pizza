-- =============================================================
-- Center Pizza · RLS para Configurações
-- Garantindo que o painel admin possa atualizar o status
-- =============================================================

-- Habilitar RLS se ainda não estiver
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (clientes precisam ver se está aberto)
DROP POLICY IF EXISTS "Permitir leitura pública" ON configuracoes;
CREATE POLICY "Permitir leitura pública" ON configuracoes 
FOR SELECT USING (true);

-- Política para atualização (apenas usuários autenticados no admin)
DROP POLICY IF EXISTS "Permitir atualização para admin" ON configuracoes;
CREATE POLICY "Permitir atualização para admin" ON configuracoes 
FOR UPDATE TO authenticated 
USING (true)
WITH CHECK (true);
