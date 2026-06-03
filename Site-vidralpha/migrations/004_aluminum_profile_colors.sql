-- ============================================================
-- Migration 004: Cores de Perfil de Alumínio
-- ============================================================

-- Tabela global de cores de perfil de alumínio
CREATE TABLE IF NOT EXISTS aluminum_colors (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL UNIQUE,
  hex_code   text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de custos por cor de alumínio (associada a linha + categoria)
CREATE TABLE IF NOT EXISTS aluminum_color_costs (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  line         text        NOT NULL,
  category     text        NOT NULL,
  color_name   text        NOT NULL REFERENCES aluminum_colors(name) ON DELETE CASCADE,
  cost_per_unit numeric(10,2) DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(line, category, color_name)
);

-- Habilitar RLS
ALTER TABLE aluminum_colors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE aluminum_color_costs ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de leitura (para uso no site público futuramente)
CREATE POLICY "aluminum_colors_select_public"
  ON aluminum_colors FOR SELECT USING (true);

CREATE POLICY "aluminum_color_costs_select_public"
  ON aluminum_color_costs FOR SELECT USING (true);

-- Políticas de escrita apenas para usuários autenticados (admin)
CREATE POLICY "aluminum_colors_insert_auth"
  ON aluminum_colors FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "aluminum_colors_update_auth"
  ON aluminum_colors FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "aluminum_colors_delete_auth"
  ON aluminum_colors FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "aluminum_color_costs_insert_auth"
  ON aluminum_color_costs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "aluminum_color_costs_update_auth"
  ON aluminum_color_costs FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "aluminum_color_costs_delete_auth"
  ON aluminum_color_costs FOR DELETE USING (auth.role() = 'authenticated');
