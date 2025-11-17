-- This script should be run AFTER creating auth users
-- First, create the shops linked to actual auth users
-- Replace the USER_ID_1 and USER_ID_2 placeholders with actual UUIDs from Supabase auth.users table

-- Step 1: Create shops for test merchants
-- These IDs should be replaced with actual user IDs from your Supabase auth system
INSERT INTO public.shops (user_id, name, description, slug, currency, tax_rate)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Tech Store', 'Electronics and gadgets shop', 'tech-store', 'USD', 10),
  ('00000000-0000-0000-0000-000000000002', 'Fashion Hub', 'Clothing and fashion store', 'fashion-hub', 'USD', 8)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Get the shop IDs (these will be used for categories and products)
-- Note: After inserting shops, use the generated shop IDs for the following inserts

-- Step 3: Create categories
INSERT INTO public.categories (shop_id, name, description, display_order)
SELECT id, 'Electronics', 'Electronic devices and gadgets', 1 FROM public.shops WHERE slug = 'tech-store'
UNION ALL
SELECT id, 'Accessories', 'Phone and computer accessories', 2 FROM public.shops WHERE slug = 'tech-store'
UNION ALL
SELECT id, 'Software', 'Digital software and licenses', 3 FROM public.shops WHERE slug = 'tech-store'
UNION ALL
SELECT id, 'Men', 'Men clothing collection', 1 FROM public.shops WHERE slug = 'fashion-hub'
UNION ALL
SELECT id, 'Women', 'Women clothing collection', 2 FROM public.shops WHERE slug = 'fashion-hub'
UNION ALL
SELECT id, 'Accessories', 'Jewelry and accessories', 3 FROM public.shops WHERE slug = 'fashion-hub'
ON CONFLICT DO NOTHING;

-- Step 4: Create products
INSERT INTO public.products (shop_id, category_id, name, description, price, compare_at_price, sku, quantity, image_url, status)
SELECT 
  s.id,
  (SELECT id FROM public.categories WHERE shop_id = s.id AND name = 'Electronics' LIMIT 1),
  'Wireless Headphones',
  'High-quality wireless headphones with noise cancellation',
  149.99,
  199.99,
  'WH-001',
  25,
  '/placeholder.svg?height=300&width=300',
  'published'
FROM public.shops s WHERE s.slug = 'tech-store'
UNION ALL
SELECT 
  s.id,
  (SELECT id FROM public.categories WHERE shop_id = s.id AND name = 'Accessories' LIMIT 1),
  'USB-C Cable',
  'Durable 2-meter USB-C charging cable',
  19.99,
  29.99,
  'UC-001',
  100,
  '/placeholder.svg?height=300&width=300',
  'published'
FROM public.shops s WHERE s.slug = 'tech-store'
UNION ALL
SELECT 
  s.id,
  (SELECT id FROM public.categories WHERE shop_id = s.id AND name = 'Electronics' LIMIT 1),
  'Laptop Stand',
  'Adjustable aluminum laptop stand',
  79.99,
  99.99,
  'LS-001',
  15,
  '/placeholder.svg?height=300&width=300',
  'published'
FROM public.shops s WHERE s.slug = 'tech-store'
UNION ALL
SELECT 
  s.id,
  (SELECT id FROM public.categories WHERE shop_id = s.id AND name = 'Electronics' LIMIT 1),
  'Webcam HD',
  '1080p HD webcam for streaming',
  89.99,
  129.99,
  'WC-001',
  20,
  '/placeholder.svg?height=300&width=300',
  'published'
FROM public.shops s WHERE s.slug = 'tech-store'
UNION ALL
SELECT 
  s.id,
  (SELECT id FROM public.categories WHERE shop_id = s.id AND name = 'Accessories' LIMIT 1),
  'Screen Protector',
  'Tempered glass screen protector pack',
  12.99,
  19.99,
  'SP-001',
  50,
  '/placeholder.svg?height=300&width=300',
  'published'
FROM public.shops s WHERE s.slug = 'tech-store'
UNION ALL
SELECT 
  s.id,
  (SELECT id FROM public.categories WHERE shop_id = s.id AND name = 'Men' LIMIT 1),
  'Classic T-Shirt',
  'Comfortable cotton t-shirt',
  24.99,
  39.99,
  'TS-001',
  60,
  '/placeholder.svg?height=300&width=300',
  'published'
FROM public.shops s WHERE s.slug = 'fashion-hub'
UNION ALL
SELECT 
  s.id,
  (SELECT id FROM public.categories WHERE shop_id = s.id AND name = 'Men' LIMIT 1),
  'Jeans',
  'Premium denim jeans',
  79.99,
  129.99,
  'JN-001',
  40,
  '/placeholder.svg?height=300&width=300',
  'published'
FROM public.shops s WHERE s.slug = 'fashion-hub'
UNION ALL
SELECT 
  s.id,
  (SELECT id FROM public.categories WHERE shop_id = s.id AND name = 'Women' LIMIT 1),
  'Summer Dress',
  'Light and breezy summer dress',
  59.99,
  89.99,
  'DR-001',
  35,
  '/placeholder.svg?height=300&width=300',
  'published'
FROM public.shops s WHERE s.slug = 'fashion-hub'
UNION ALL
SELECT 
  s.id,
  (SELECT id FROM public.categories WHERE shop_id = s.id AND name = 'Women' LIMIT 1),
  'Cardigan',
  'Elegant cardigan sweater',
  69.99,
  99.99,
  'CA-001',
  25,
  '/placeholder.svg?height=300&width=300',
  'published'
FROM public.shops s WHERE s.slug = 'fashion-hub'
UNION ALL
SELECT 
  s.id,
  (SELECT id FROM public.categories WHERE shop_id = s.id AND name = 'Accessories' LIMIT 1),
  'Gold Necklace',
  'Elegant gold chain necklace',
  34.99,
  49.99,
  'NK-001',
  15,
  '/placeholder.svg?height=300&width=300',
  'published'
FROM public.shops s WHERE s.slug = 'fashion-hub'
ON CONFLICT DO NOTHING;

-- Step 5: Create test orders
INSERT INTO public.orders (shop_id, customer_email, customer_name, customer_phone, total_amount, status, payment_method, shipping_address, notes)
SELECT 
  id,
  'customer1@example.com',
  'John Smith',
  '+1-555-0101',
  249.98,
  'completed',
  'cod',
  '123 Main St, New York, NY 10001',
  'Delivery completed successfully'
FROM public.shops WHERE slug = 'tech-store'
UNION ALL
SELECT 
  id,
  'customer2@example.com',
  'Jane Doe',
  '+1-555-0102',
  169.97,
  'pending',
  'cod',
  '456 Oak Ave, Los Angeles, CA 90001',
  'Order pending pickup'
FROM public.shops WHERE slug = 'tech-store'
UNION ALL
SELECT 
  id,
  'customer3@example.com',
  'Mike Johnson',
  '+1-555-0103',
  79.99,
  'completed',
  'cod',
  '789 Pine Rd, Chicago, IL 60601',
  'Delivered on time'
FROM public.shops WHERE slug = 'tech-store'
UNION ALL
SELECT 
  id,
  'customer4@example.com',
  'Emily Brown',
  '+1-555-0104',
  139.98,
  'completed',
  'cod',
  '321 Elm St, Houston, TX 77001',
  'Satisfied customer'
FROM public.shops WHERE slug = 'fashion-hub'
UNION ALL
SELECT 
  id,
  'customer5@example.com',
  'Robert Wilson',
  '+1-555-0105',
  184.97,
  'pending',
  'cod',
  '654 Maple Dr, Phoenix, AZ 85001',
  'Awaiting confirmation'
FROM public.shops WHERE slug = 'fashion-hub'
UNION ALL
SELECT 
  id,
  'customer6@example.com',
  'Sarah Davis',
  '+1-555-0106',
  94.98,
  'processing',
  'cod',
  '987 Birch Ln, Philadelphia, PA 19101',
  'Order being packed'
FROM public.shops WHERE slug = 'fashion-hub'
ON CONFLICT DO NOTHING;
