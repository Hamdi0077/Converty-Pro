-- Create users profiles table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  shop_name TEXT,
  shop_slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Create shops table (multi-tenant)
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Users can view/manage shops they own
CREATE POLICY "shops_select_own" ON public.shops FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shops_insert_own" ON public.shops FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shops_update_own" ON public.shops FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shops_delete_own" ON public.shops FOR DELETE USING (auth.uid() = user_id);

-- Customers can view public shops
CREATE POLICY "shops_select_public" ON public.shops FOR SELECT USING (true);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Users can manage their shop's categories
CREATE POLICY "categories_select_own" ON public.categories FOR SELECT USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "categories_insert_own" ON public.categories FOR INSERT WITH CHECK (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "categories_update_own" ON public.categories FOR UPDATE USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "categories_delete_own" ON public.categories FOR DELETE USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

-- Customers can view public categories
CREATE POLICY "categories_select_public" ON public.categories FOR SELECT USING (
  shop_id IN (SELECT id FROM public.shops)
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  sku TEXT,
  quantity INT DEFAULT 0,
  image_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Users can manage their shop's products
CREATE POLICY "products_select_own" ON public.products FOR SELECT USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "products_insert_own" ON public.products FOR INSERT WITH CHECK (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "products_update_own" ON public.products FOR UPDATE USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "products_delete_own" ON public.products FOR DELETE USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

-- Customers can view published products
CREATE POLICY "products_select_public" ON public.products FOR SELECT USING (
  status = 'published' AND shop_id IN (SELECT id FROM public.shops)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their shop's orders
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "orders_update_own" ON public.orders FOR UPDATE USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can view order items from their orders
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM public.orders WHERE shop_id IN (
      SELECT id FROM public.shops WHERE user_id = auth.uid()
    )
  )
);
