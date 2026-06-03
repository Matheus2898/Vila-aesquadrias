-- Create product_lines table
CREATE TABLE IF NOT EXISTS public.product_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    is_accessory BOOLEAN DEFAULT false,
    accessory_type TEXT, -- 'Gold', 'Suprema', ou null/'nenhum'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.product_lines ENABLE ROW LEVEL SECURITY;

-- Create policies for product_lines
CREATE POLICY "Enable read access for all users" ON public.product_lines
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.product_lines
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.product_lines
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.product_lines
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert existing lines from item_costs
INSERT INTO public.product_lines (name, is_accessory)
SELECT DISTINCT line, false
FROM public.item_costs
ON CONFLICT (name) DO NOTHING;
