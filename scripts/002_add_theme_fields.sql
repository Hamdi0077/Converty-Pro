-- adding additional theme fields to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#f59e0b',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'sans';
