-- adding shop settings fields to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS store_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#f59e0b',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'sans';
