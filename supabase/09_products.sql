-- ============================================
-- 9. PRODUCTS + VARIANTS + DELIVERY + OFFERS + REVIEWS
-- ============================================

-- Main products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE,
  description text DEFAULT '',
  short_description text DEFAULT '',
  category text NOT NULL,
  sub_category text,
  brand text,
  model_number text,
  sku text,
  price numeric NOT NULL DEFAULT 0,
  mrp numeric DEFAULT 0,
  discount_price numeric,
  currency text DEFAULT 'INR',
  stock integer DEFAULT 0,
  image_url text DEFAULT '',
  images text[] DEFAULT '{}',
  videos text[] DEFAULT '{}',
  highlights text[] DEFAULT '{}',
  specifications jsonb DEFAULT '[]',
  seller_notes text[] DEFAULT '{}',
  gst_rate numeric DEFAULT 0,
  platform_fee numeric DEFAULT 7.5,
  commission numeric DEFAULT 0.5,
  package_weight numeric DEFAULT 0,
  package_length numeric DEFAULT 0,
  package_width numeric DEFAULT 0,
  package_height numeric DEFAULT 0,
  shipping_type text DEFAULT 'self',
  manufacturer_name text,
  manufacturer_address text,
  packing_details text,
  courier_partner text,
  cancellation_policy_days integer DEFAULT 7,
  return_policy_days integer DEFAULT 7,
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('draft','pending','approved','rejected')),
  is_active boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product variants (size / color)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_type text NOT NULL CHECK (variant_type IN ('size','color')),
  size text,
  size_system text,
  color text,
  color_hex text,
  sku text,
  price numeric DEFAULT 0,
  stock integer DEFAULT 0,
  quantity integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Delivery countries per product
CREATE TABLE IF NOT EXISTS public.delivery_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  country_name text,
  delivery_charge numeric DEFAULT 0,
  min_order_qty integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Offer rules per product
CREATE TABLE IF NOT EXISTS public.offer_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  offer_type text NOT NULL CHECK (offer_type IN ('buy_x_get_y','special_day','hourly','bundle')),
  buy_quantity integer,
  get_quantity integer,
  special_day_name text,
  discount_percent numeric,
  start_time text,
  end_time text,
  bundle_min_qty integer,
  bundle_discount numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Product reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  heading text,
  comment text,
  images text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_delivery_countries_product ON public.delivery_countries(product_id);
CREATE INDEX IF NOT EXISTS idx_offer_rules_product ON public.offer_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read approved+active; sellers own; admins all
CREATE POLICY "products_public_read" ON public.products FOR SELECT
  USING (approval_status = 'approved' AND is_active = true);

CREATE POLICY "products_seller_read" ON public.products FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "products_seller_insert" ON public.products FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "products_seller_update" ON public.products FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "products_admin_all" ON public.products FOR ALL
  USING (public.get_my_role() = 'admin');

-- Variants: read via product access; sellers insert/update own product's variants; admin all
CREATE POLICY "variants_read" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "variants_seller_insert" ON public.product_variants FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid()));
CREATE POLICY "variants_seller_update" ON public.product_variants FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid()));
CREATE POLICY "variants_seller_delete" ON public.product_variants FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid()));
CREATE POLICY "variants_admin" ON public.product_variants FOR ALL
  USING (public.get_my_role() = 'admin');

-- Delivery countries: same pattern
CREATE POLICY "dc_read" ON public.delivery_countries FOR SELECT USING (true);
CREATE POLICY "dc_seller_insert" ON public.delivery_countries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid()));
CREATE POLICY "dc_seller_delete" ON public.delivery_countries FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid()));
CREATE POLICY "dc_admin" ON public.delivery_countries FOR ALL
  USING (public.get_my_role() = 'admin');

-- Offer rules: same pattern
CREATE POLICY "or_read" ON public.offer_rules FOR SELECT USING (true);
CREATE POLICY "or_seller_insert" ON public.offer_rules FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid()));
CREATE POLICY "or_seller_update" ON public.offer_rules FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid()));
CREATE POLICY "or_seller_delete" ON public.offer_rules FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid()));
CREATE POLICY "or_admin" ON public.offer_rules FOR ALL
  USING (public.get_my_role() = 'admin');

-- Reviews: anyone reads; users insert own; admin all
CREATE POLICY "reviews_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_user_insert" ON public.reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_user_update" ON public.reviews FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "reviews_admin" ON public.reviews FOR ALL
  USING (public.get_my_role() = 'admin');

-- ============================================
-- STORAGE: product-images bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_seller_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "product_images_seller_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);
