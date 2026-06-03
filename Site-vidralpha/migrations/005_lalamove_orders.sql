-- ============================================================================
-- MIGRAÇÃO 005: Tabela Orders + Campos de Prazo em Products + Campos Lalamove
-- ============================================================================

-- ─── 1. Adicionar campos de prazo escalonado na tabela products ───────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS prazo_base INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS dias_extras_por_unidade INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN products.prazo_base IS 'Dias úteis de prazo base de produção (para 1 unidade)';
COMMENT ON COLUMN products.dias_extras_por_unidade IS 'Dias úteis extras por unidade adicional comprada';

-- ─── 2. Criar tabela orders (Pedidos Finalizados com Lalamove) ────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Itens do pedido (snapshot no momento da compra)
  items JSONB NOT NULL DEFAULT '[]',

  -- Valores
  total_price DECIMAL(10,2),
  freight_price DECIMAL(10,2),

  -- Status do pedido
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'delivered')),

  -- Status interno de produção
  status_producao TEXT DEFAULT 'Pendente' CHECK (status_producao IN ('Pendente', 'Em Produção', 'Concluída')),

  -- Campos Lalamove
  lalamove_order_id TEXT,           -- ID do pedido retornado pela Lalamove
  lalamove_quotation_id TEXT,       -- ID da cotação
  schedule_at TIMESTAMPTZ,          -- Data/hora agendada para coleta (UTC)
  lalamove_share_link TEXT,         -- Link de rastreamento (se disponível)

  -- Endereço de entrega (snapshot)
  delivery_address JSONB,

  -- Prazo calculado (dias úteis, salvo no momento do checkout)
  prazo_dias_uteis INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_status_producao ON orders(status_producao);
CREATE INDEX IF NOT EXISTS idx_orders_schedule_at ON orders(schedule_at);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_lalamove_order_id ON orders(lalamove_order_id);

-- ─── 3. RLS Policies para orders ─────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- Clientes veem apenas seus próprios pedidos
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Clientes podem criar pedidos
CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins veem todos
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (public.is_admin());

-- Admins podem atualizar (para mudar status_producao, etc.)
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (public.is_admin());

-- ─── 4. Trigger de updated_at para orders ────────────────────────────────────
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 5. FIM ──────────────────────────────────────────────────────────────────
