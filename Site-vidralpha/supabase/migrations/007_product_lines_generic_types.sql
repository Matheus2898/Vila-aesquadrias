-- Add the generic line_type column with default 'esquadria'
ALTER TABLE product_lines ADD COLUMN line_type text;
UPDATE product_lines SET line_type = 'esquadria' WHERE line_type IS NULL;
ALTER TABLE product_lines ALTER COLUMN line_type SET DEFAULT 'esquadria';

-- Migrate existing accessories
UPDATE product_lines SET line_type = 'acessorio' WHERE is_accessory = true;

-- Notice: We are keeping the is_accessory column for backward compatibility 
-- just in case any unmigrated code relies on it, but frontend will now use line_type.
