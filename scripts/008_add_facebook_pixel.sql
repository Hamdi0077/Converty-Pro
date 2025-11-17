-- adding facebook pixel field to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT;

