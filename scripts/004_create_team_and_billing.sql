-- create team members table for multi-user shop management
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  status TEXT DEFAULT 'pending',
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_select_own_shop" ON public.team_members FOR SELECT USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

CREATE POLICY "team_insert_own_shop" ON public.team_members FOR INSERT WITH CHECK (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

CREATE POLICY "team_update_own_shop" ON public.team_members FOR UPDATE USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

CREATE POLICY "team_delete_own_shop" ON public.team_members FOR DELETE USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

-- create billing and subscription table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL UNIQUE REFERENCES public.shops(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  price DECIMAL(10,2) DEFAULT 0,
  billing_cycle TEXT DEFAULT 'monthly',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

CREATE POLICY "subscriptions_update" ON public.subscriptions FOR UPDATE USING (
  shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

-- create billing history table
CREATE TABLE IF NOT EXISTS public.billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_select" ON public.billing_history FOR SELECT USING (
  subscription_id IN (
    SELECT id FROM public.subscriptions WHERE shop_id IN (
      SELECT id FROM public.shops WHERE user_id = auth.uid()
    )
  )
);
