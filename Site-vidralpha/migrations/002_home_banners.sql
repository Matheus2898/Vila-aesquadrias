-- ============================================================================
-- TABELA: home_banners
-- ============================================================================
CREATE TABLE IF NOT EXISTS home_banners (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  background_position TEXT DEFAULT 'center',
  badge_text TEXT,
  title_line1 TEXT NOT NULL,
  title_highlight TEXT,
  subtitle TEXT,
  button_text TEXT,
  button_link TEXT DEFAULT '/produtos',
  button_bg_color TEXT DEFAULT 'btn-primary',
  button_text_color TEXT DEFAULT '#FFFFFF',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices e Trigger Update
CREATE INDEX IF NOT EXISTS idx_home_banners_is_active ON home_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_home_banners_order ON home_banners(order_index);

DROP TRIGGER IF EXISTS update_home_banners_updated_at ON home_banners;
CREATE TRIGGER update_home_banners_updated_at BEFORE UPDATE ON home_banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE home_banners ENABLE ROW LEVEL SECURITY;

-- Drop policies se já existirem
DROP POLICY IF EXISTS "Anyone can view active banners" ON home_banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON home_banners;
DROP POLICY IF EXISTS "Admins can update banners" ON home_banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON home_banners;

-- Visitantes e clientes normais podem ver
CREATE POLICY "Anyone can view active banners" ON home_banners
  FOR SELECT USING (true);

-- Admins tem permissão total
CREATE POLICY "Admins can insert banners" ON home_banners
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update banners" ON home_banners
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete banners" ON home_banners
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
