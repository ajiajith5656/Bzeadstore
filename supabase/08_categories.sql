-- ============================================
-- 8. CATEGORIES & SUB-CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, name)
);

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin" ON public.categories FOR ALL
  USING (public.get_my_role() = 'admin');

CREATE POLICY "sub_categories_read" ON public.sub_categories FOR SELECT USING (true);
CREATE POLICY "sub_categories_admin" ON public.sub_categories FOR ALL
  USING (public.get_my_role() = 'admin');

-- Seed categories
INSERT INTO public.categories (name, display_order) VALUES
  ('Electronics', 1),
  ('Fashion', 2),
  ('Home & Garden', 3),
  ('Sports & Outdoors', 4),
  ('Books', 5),
  ('Toys & Games', 6),
  ('Beauty & Personal Care', 7),
  ('Automotive', 8),
  ('Health & Wellness', 9),
  ('Jewellery & Accessories', 10),
  ('Grocery & Gourmet', 11),
  ('Pet Supplies', 12)
ON CONFLICT (name) DO NOTHING;
