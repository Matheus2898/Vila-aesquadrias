-- ============================================================================
-- 1. TABELA: profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- RLS Policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes antes de recriar
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins podem ver todos os perfis usando Security Definer para evitar recursão infinita
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING ( public.is_admin() );

-- ============================================================================
-- 2. TABELA: item_costs (Linhas, Categorias e Medidas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS item_costs (
  id SERIAL PRIMARY KEY,
  line TEXT NOT NULL,
  category TEXT NOT NULL,
  measure TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(line, category, measure)
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_item_costs_line ON item_costs(line);
CREATE INDEX IF NOT EXISTS idx_item_costs_category ON item_costs(category);
CREATE INDEX IF NOT EXISTS idx_item_costs_line_category ON item_costs(line, category);

-- RLS Policy
ALTER TABLE item_costs ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes
DROP POLICY IF EXISTS "Anyone can view item_costs" ON item_costs;
DROP POLICY IF EXISTS "Admins can insert item_costs" ON item_costs;
DROP POLICY IF EXISTS "Admins can update item_costs" ON item_costs;
DROP POLICY IF EXISTS "Admins can delete item_costs" ON item_costs;

-- Todos podem ler (público para catálogo)
CREATE POLICY "Anyone can view item_costs" ON item_costs
  FOR SELECT USING (true);

-- Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "Admins can insert item_costs" ON item_costs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update item_costs" ON item_costs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete item_costs" ON item_costs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 3. TABELA: glass_type_costs (Tipos de Vidro e Espessuras)
-- ============================================================================
CREATE TABLE IF NOT EXISTS glass_type_costs (
  id SERIAL PRIMARY KEY,
  glass_type TEXT NOT NULL,
  thickness TEXT NOT NULL,
  cost_per_m2 DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(glass_type, thickness)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_glass_type ON glass_type_costs(glass_type);
CREATE INDEX IF NOT EXISTS idx_glass_thickness ON glass_type_costs(thickness);

-- RLS Policy
ALTER TABLE glass_type_costs ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes
DROP POLICY IF EXISTS "Anyone can view glass_type_costs" ON glass_type_costs;
DROP POLICY IF EXISTS "Admins can insert glass_type_costs" ON glass_type_costs;
DROP POLICY IF EXISTS "Admins can update glass_type_costs" ON glass_type_costs;
DROP POLICY IF EXISTS "Admins can delete glass_type_costs" ON glass_type_costs;

CREATE POLICY "Anyone can view glass_type_costs" ON glass_type_costs
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert glass_type_costs" ON glass_type_costs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update glass_type_costs" ON glass_type_costs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete glass_type_costs" ON glass_type_costs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 4. TABELA: glass_colors (Cores de Vidro)
-- ============================================================================
CREATE TABLE IF NOT EXISTS glass_colors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  hex_code TEXT DEFAULT '#CCCCCC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE glass_colors ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes
DROP POLICY IF EXISTS "Anyone can view glass_colors" ON glass_colors;
DROP POLICY IF EXISTS "Admins can insert glass_colors" ON glass_colors;
DROP POLICY IF EXISTS "Admins can update glass_colors" ON glass_colors;
DROP POLICY IF EXISTS "Admins can delete glass_colors" ON glass_colors;

CREATE POLICY "Anyone can view glass_colors" ON glass_colors
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert glass_colors" ON glass_colors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update glass_colors" ON glass_colors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete glass_colors" ON glass_colors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 5. TABELA: glass_color_costs (Custos por Cor de Vidro)
-- ============================================================================
CREATE TABLE IF NOT EXISTS glass_color_costs (
  id SERIAL PRIMARY KEY,
  glass_type TEXT NOT NULL,
  thickness TEXT NOT NULL,
  color_name TEXT NOT NULL,
  cost_per_m2 DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(glass_type, thickness, color_name),
  FOREIGN KEY (color_name) REFERENCES glass_colors(name) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_glass_color_costs_type ON glass_color_costs(glass_type);
CREATE INDEX IF NOT EXISTS idx_glass_color_costs_thickness ON glass_color_costs(thickness);
CREATE INDEX IF NOT EXISTS idx_glass_color_costs_color ON glass_color_costs(color_name);
CREATE INDEX IF NOT EXISTS idx_glass_color_costs_type_thickness ON glass_color_costs(glass_type, thickness);

-- RLS Policy
ALTER TABLE glass_color_costs ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes
DROP POLICY IF EXISTS "Anyone can view glass_color_costs" ON glass_color_costs;
DROP POLICY IF EXISTS "Admins can insert glass_color_costs" ON glass_color_costs;
DROP POLICY IF EXISTS "Admins can update glass_color_costs" ON glass_color_costs;
DROP POLICY IF EXISTS "Admins can delete glass_color_costs" ON glass_color_costs;

CREATE POLICY "Anyone can view glass_color_costs" ON glass_color_costs
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert glass_color_costs" ON glass_color_costs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update glass_color_costs" ON glass_color_costs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete glass_color_costs" ON glass_color_costs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 6. TABELA: products (Produtos/Esquadrias)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  line TEXT NOT NULL,
  category TEXT NOT NULL,
  sku_code TEXT UNIQUE NOT NULL,
  description TEXT,
  specs TEXT,
  warranty TEXT,
  markup DECIMAL(5,2) DEFAULT 0,
  taxes DECIMAL(5,2) DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  old_price DECIMAL(10,2),
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  measures JSONB DEFAULT '[]',
  glass_types TEXT[] DEFAULT '{}',
  glass_thickness TEXT[] DEFAULT '{}',
  glass_colors TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  ncm TEXT,
  icms TEXT,
  ipi TEXT,
  ii TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_line ON products(line);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku_code);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- RLS Policy
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 7. TABELA: cart_items (Carrinho de Compras) - CORREÇÃO CRÍTICA
-- ============================================================================
-- CORREÇÃO: Adicionamos uma coluna 'options_hash' para criar uma PK única
-- que suporta múltiplas variações do mesmo produto com opções diferentes

-- Primeiro, verificar se a tabela existe e adicionar colunas se necessário
DO $$
BEGIN
  -- Verificar se a tabela existe
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cart_items') THEN
    -- Adicionar coluna selected_options se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cart_items' AND column_name = 'selected_options') THEN
      ALTER TABLE cart_items ADD COLUMN selected_options JSONB DEFAULT '{}';
    END IF;
    
    -- Adicionar coluna options_hash se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cart_items' AND column_name = 'options_hash') THEN
      ALTER TABLE cart_items ADD COLUMN options_hash TEXT;
      
      -- Preencher options_hash para linhas existentes
      UPDATE cart_items 
      SET options_hash = md5(
        product_id || '-' || 
        COALESCE(selected_options->>'size', '') || '-' ||
        COALESCE(selected_options->>'color', '') || '-' ||
        COALESCE(selected_options->>'glass_type', '') || '-' ||
        COALESCE(selected_options->>'glass_thickness', '') || '-' ||
        COALESCE(selected_options->>'glass_color', '')
      )
      WHERE options_hash IS NULL;
    END IF;
    
    -- Adicionar constraint UNIQUE se não existir
    IF NOT EXISTS (
      SELECT FROM pg_constraint 
      WHERE conname = 'cart_items_user_product_options_unique'
    ) THEN
      ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_product_options_unique 
      UNIQUE(user_id, product_id, options_hash);
    END IF;
  ELSE
    -- Criar tabela do zero se não existir
    CREATE TABLE cart_items (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      selected_options JSONB NOT NULL DEFAULT '{}',
      options_hash TEXT GENERATED ALWAYS AS (
        md5(
          product_id || '-' || 
          COALESCE(selected_options->>'size', '') || '-' ||
          COALESCE(selected_options->>'color', '') || '-' ||
          COALESCE(selected_options->>'glass_type', '') || '-' ||
          COALESCE(selected_options->>'glass_thickness', '') || '-' ||
          COALESCE(selected_options->>'glass_color', '')
        )
      ) STORED,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT cart_items_user_product_options_unique UNIQUE(user_id, product_id, options_hash)
    );
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_options_hash ON cart_items(options_hash);

-- RLS Policy
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can insert into own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can delete from own cart" ON cart_items;

-- Usuários podem ver apenas seus próprios itens do carrinho
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own cart" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. TABELA: quotes (Orçamentos/Pedidos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  complex_request BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
  admin_notes TEXT,
  total_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- RLS Policy
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes
DROP POLICY IF EXISTS "Users can view own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON quotes;
DROP POLICY IF EXISTS "Admins can update quotes" ON quotes;

-- Clientes podem ver apenas seus próprios orçamentos
CREATE POLICY "Users can view own quotes" ON quotes
  FOR SELECT USING (auth.uid() = client_id);

-- Clientes podem criar orçamentos
CREATE POLICY "Users can create quotes" ON quotes
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Admins podem ver todos os orçamentos
CREATE POLICY "Admins can view all quotes" ON quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins podem atualizar orçamentos
CREATE POLICY "Admins can update quotes" ON quotes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 9. TRIGGER: Atualizar updated_at automaticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers em tabelas com updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_item_costs_updated_at ON item_costs;
CREATE TRIGGER update_item_costs_updated_at BEFORE UPDATE ON item_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_glass_type_costs_updated_at ON glass_type_costs;
CREATE TRIGGER update_glass_type_costs_updated_at BEFORE UPDATE ON glass_type_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_glass_color_costs_updated_at ON glass_color_costs;
CREATE TRIGGER update_glass_color_costs_updated_at BEFORE UPDATE ON glass_color_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. DADOS INICIAIS (Seed)
-- ============================================================================

-- Inserir cores de vidro padrão se não existirem
INSERT INTO glass_colors (name, hex_code) VALUES
  ('Incolor', '#F0F8FB'),
  ('Fumê', '#4A5568'),
  ('Verde', '#86efac'),
  ('Bronze', '#d97706'),
  ('Azul', '#93c5fd')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
