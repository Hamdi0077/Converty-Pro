-- Script pour vérifier la configuration du Facebook Pixel
-- Vérifie si la colonne existe et affiche les valeurs

-- 1. Vérifier si la colonne existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'shops' 
AND column_name = 'facebook_pixel_id';

-- 2. Afficher toutes les boutiques avec leur Pixel ID
SELECT 
    id,
    name,
    slug,
    facebook_pixel_id,
    CASE 
        WHEN facebook_pixel_id IS NULL THEN '❌ Pas de Pixel ID'
        WHEN facebook_pixel_id = '' THEN '⚠️ Pixel ID vide'
        ELSE '✅ Pixel ID configuré'
    END as status
FROM shops
ORDER BY created_at DESC;

