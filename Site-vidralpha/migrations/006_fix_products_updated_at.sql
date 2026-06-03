-- ============================================================================
-- MIGRAÇÃO 006: Correção do trigger updated_at em products
-- Erro: "record 'new' has no field 'updated_at'"
-- Causa: O trigger tenta setar NEW.updated_at mas a coluna pode não existir
--        ou o trigger está apontando para a tabela errada após alterações.
-- ============================================================================

-- 1. Garantir que a coluna updated_at existe na tabela products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Recriar o trigger de forma segura (DROP + CREATE)
DROP TRIGGER IF EXISTS update_products_updated_at ON products;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Verificação: garantir que a função update_updated_at_column existe
--    (recria sem afetar outros triggers que já a usam)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recriar o trigger após garantir a função
DROP TRIGGER IF EXISTS update_products_updated_at ON products;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- FIM
