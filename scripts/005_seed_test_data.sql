-- Seed test data for Converty Pro
-- This script populates the database with test shops, products, categories, and orders

-- Test data will be inserted into existing tables
-- Note: Auth users must be created separately via Supabase auth API

-- Insert test categories for Shop 1 (Tech Store)
INSERT INTO public.categories (shop_id, name, description, display_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'Electronic devices and gadgets', 1),
('550e8400-e29b-41d4-a716-446655440001', 'Accessories', 'Phone and computer accessories', 2),
('550e8400-e29b-41d4-a716-446655440001', 'Software', 'Digital software and licenses', 3)
ON CONFLICT DO NOTHING;

-- Insert test categories for Shop 2 (Fashion Store)
INSERT INTO public.categories (shop_id, name, description, display_order) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'Men', 'Men clothing collection', 1),
('550e8400-e29b-41d4-a716-446655440002', 'Women', 'Women clothing collection', 2),
('550e8400-e29b-41d4-a716-446655440002', 'Accessories', 'Jewelry and accessories', 3)
ON CONFLICT DO NOTHING;

-- Insert test products for Shop 1 (Tech Store)
INSERT INTO public.products (shop_id, category_id, name, description, price, compare_at_price, sku, quantity, image_url, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 149.99, 199.99, 'WH-001', 25, '/placeholder.svg?height=300&width=300', 'published'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'USB-C Cable', 'Durable 2-meter USB-C charging cable', 19.99, 29.99, 'UC-001', 100, '/placeholder.svg?height=300&width=300', 'published'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'Laptop Stand', 'Adjustable aluminum laptop stand', 79.99, 99.99, 'LS-001', 15, '/placeholder.svg?height=300&width=300', 'published'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'Webcam HD', '1080p HD webcam for streaming', 89.99, 129.99, 'WC-001', 20, '/placeholder.svg?height=300&width=300', 'published'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', 'Screen Protector', 'Tempered glass screen protector pack', 12.99, 19.99, 'SP-001', 50, '/placeholder.svg?height=300&width=300', 'published')
ON CONFLICT DO NOTHING;

-- Insert test products for Shop 2 (Fashion Store)
INSERT INTO public.products (shop_id, category_id, name, description, price, compare_at_price, sku, quantity, image_url, status) VALUES
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440201', 'Classic T-Shirt', 'Comfortable cotton t-shirt', 24.99, 39.99, 'TS-001', 60, '/placeholder.svg?height=300&width=300', 'published'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440201', 'Jeans', 'Premium denim jeans', 79.99, 129.99, 'JN-001', 40, '/placeholder.svg?height=300&width=300', 'published'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440202', 'Summer Dress', 'Light and breezy summer dress', 59.99, 89.99, 'DR-001', 35, '/placeholder.svg?height=300&width=300', 'published'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440202', 'Cardigan', 'Elegant cardigan sweater', 69.99, 99.99, 'CA-001', 25, '/placeholder.svg?height=300&width=300', 'published'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440203', 'Gold Necklace', 'Elegant gold chain necklace', 34.99, 49.99, 'NK-001', 15, '/placeholder.svg?height=300&width=300', 'published')
ON CONFLICT DO NOTHING;

-- Insert test orders for Shop 1
INSERT INTO public.orders (shop_id, customer_email, customer_name, customer_phone, total_amount, status, payment_method, shipping_address, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'customer1@example.com', 'John Smith', '+1-555-0101', 249.98, 'completed', 'cod', '123 Main St, New York, NY 10001', 'Delivery completed successfully'),
('550e8400-e29b-41d4-a716-446655440001', 'customer2@example.com', 'Jane Doe', '+1-555-0102', 169.97, 'pending', 'cod', '456 Oak Ave, Los Angeles, CA 90001', 'Order pending pickup'),
('550e8400-e29b-41d4-a716-446655440001', 'customer3@example.com', 'Mike Johnson', '+1-555-0103', 79.99, 'completed', 'cod', '789 Pine Rd, Chicago, IL 60601', 'Delivered on time')
ON CONFLICT DO NOTHING;

-- Insert test orders for Shop 2
INSERT INTO public.orders (shop_id, customer_email, customer_name, customer_phone, total_amount, status, payment_method, shipping_address, notes) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'customer4@example.com', 'Emily Brown', '+1-555-0104', 139.98, 'completed', 'cod', '321 Elm St, Houston, TX 77001', 'Satisfied customer'),
('550e8400-e29b-41d4-a716-446655440002', 'customer5@example.com', 'Robert Wilson', '+1-555-0105', 184.97, 'pending', 'cod', '654 Maple Dr, Phoenix, AZ 85001', 'Awaiting confirmation'),
('550e8400-e29b-41d4-a716-446655440002', 'customer6@example.com', 'Sarah Davis', '+1-555-0106', 94.98, 'processing', 'cod', '987 Birch Ln, Philadelphia, PA 19101', 'Order being packed')
ON CONFLICT DO NOTHING;

-- Insert test order items
INSERT INTO public.order_items (order_id, product_id, product_name, quantity, price) VALUES
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440001', 'Wireless Headphones', 1, 149.99),
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440002', 'USB-C Cable', 1, 99.99),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440003', 'Laptop Stand', 1, 79.99),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440005', 'Screen Protector', 1, 89.98),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440004', 'Webcam HD', 1, 79.99)
ON CONFLICT DO NOTHING;
