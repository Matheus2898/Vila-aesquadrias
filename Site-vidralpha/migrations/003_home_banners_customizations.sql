-- Adicionar colunas de customização de UX para banners dinâmicos
ALTER TABLE home_banners ADD COLUMN IF NOT EXISTS content_align VARCHAR(20) DEFAULT 'left';
ALTER TABLE home_banners ADD COLUMN IF NOT EXISTS content_offset_x INTEGER DEFAULT 0;
ALTER TABLE home_banners ADD COLUMN IF NOT EXISTS title_size INTEGER DEFAULT 75;

-- Atualizar metadados para triggers e roles se existirem (Pós-deploy normal de colunas)
NOTIFY pgrst, 'reload schema';
