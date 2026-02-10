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

-- Seed sub-categories
INSERT INTO public.sub_categories (category_id, name) VALUES
  -- Electronics
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Mobiles & Smartphones'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Laptops & Computers'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Tablets'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Televisions'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Cameras'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Audio (Headphones, Speakers)'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Wearable Technology'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Computer Accessories'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Mobile Accessories'),
  ((SELECT id FROM public.categories WHERE name = 'Electronics'), 'Gaming Consoles & Accessories'),

  -- Fashion
  ((SELECT id FROM public.categories WHERE name = 'Fashion'), 'Men''s Clothing'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion'), 'Women''s Clothing'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion'), 'Kids & Baby Clothing'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion'), 'Footwear'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion'), 'Watches'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion'), 'Fashion Jewellery'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion'), 'Bags & Luggage'),
  ((SELECT id FROM public.categories WHERE name = 'Fashion'), 'Sunglasses & Accessories'),

  -- Home & Garden
  ((SELECT id FROM public.categories WHERE name = 'Home & Garden'), 'Furniture'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Garden'), 'Home Décor'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Garden'), 'Kitchen & Dining'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Garden'), 'Cookware'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Garden'), 'Home Storage'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Garden'), 'Bedding & Furnishings'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Garden'), 'Lighting'),
  ((SELECT id FROM public.categories WHERE name = 'Home & Garden'), 'Garden & Outdoor'),

  -- Sports & Outdoors
  ((SELECT id FROM public.categories WHERE name = 'Sports & Outdoors'), 'Fitness Equipment'),
  ((SELECT id FROM public.categories WHERE name = 'Sports & Outdoors'), 'Sports Gear'),
  ((SELECT id FROM public.categories WHERE name = 'Sports & Outdoors'), 'Outdoor & Adventure'),
  ((SELECT id FROM public.categories WHERE name = 'Sports & Outdoors'), 'Cycling'),
  ((SELECT id FROM public.categories WHERE name = 'Sports & Outdoors'), 'Yoga & Meditation'),
  ((SELECT id FROM public.categories WHERE name = 'Sports & Outdoors'), 'Team Sports'),
  ((SELECT id FROM public.categories WHERE name = 'Sports & Outdoors'), 'Gym Accessories'),
  ((SELECT id FROM public.categories WHERE name = 'Sports & Outdoors'), 'Swimming & Watersports'),

  -- Books
  ((SELECT id FROM public.categories WHERE name = 'Books'), 'Fiction'),
  ((SELECT id FROM public.categories WHERE name = 'Books'), 'Non-Fiction'),
  ((SELECT id FROM public.categories WHERE name = 'Books'), 'Academic & Textbooks'),
  ((SELECT id FROM public.categories WHERE name = 'Books'), 'Competitive Exam Prep'),
  ((SELECT id FROM public.categories WHERE name = 'Books'), 'Children''s Books'),
  ((SELECT id FROM public.categories WHERE name = 'Books'), 'Comics & Manga'),
  ((SELECT id FROM public.categories WHERE name = 'Books'), 'E-Books'),
  ((SELECT id FROM public.categories WHERE name = 'Books'), 'Self-Help & Motivation'),

  -- Toys & Games
  ((SELECT id FROM public.categories WHERE name = 'Toys & Games'), 'Toys & Action Figures'),
  ((SELECT id FROM public.categories WHERE name = 'Toys & Games'), 'Educational Toys'),
  ((SELECT id FROM public.categories WHERE name = 'Toys & Games'), 'Board Games'),
  ((SELECT id FROM public.categories WHERE name = 'Toys & Games'), 'Puzzles'),
  ((SELECT id FROM public.categories WHERE name = 'Toys & Games'), 'Baby Toys'),
  ((SELECT id FROM public.categories WHERE name = 'Toys & Games'), 'Kids Ride-Ons'),
  ((SELECT id FROM public.categories WHERE name = 'Toys & Games'), 'School & Learning Toys'),
  ((SELECT id FROM public.categories WHERE name = 'Toys & Games'), 'Dolls & Stuffed Animals'),

  -- Beauty & Personal Care
  ((SELECT id FROM public.categories WHERE name = 'Beauty & Personal Care'), 'Skincare'),
  ((SELECT id FROM public.categories WHERE name = 'Beauty & Personal Care'), 'Haircare'),
  ((SELECT id FROM public.categories WHERE name = 'Beauty & Personal Care'), 'Makeup'),
  ((SELECT id FROM public.categories WHERE name = 'Beauty & Personal Care'), 'Fragrances'),
  ((SELECT id FROM public.categories WHERE name = 'Beauty & Personal Care'), 'Grooming & Shaving'),
  ((SELECT id FROM public.categories WHERE name = 'Beauty & Personal Care'), 'Bath & Body'),
  ((SELECT id FROM public.categories WHERE name = 'Beauty & Personal Care'), 'Beauty Tools & Accessories'),
  ((SELECT id FROM public.categories WHERE name = 'Beauty & Personal Care'), 'Nail Care'),

  -- Automotive
  ((SELECT id FROM public.categories WHERE name = 'Automotive'), 'Car Accessories'),
  ((SELECT id FROM public.categories WHERE name = 'Automotive'), 'Bike Accessories'),
  ((SELECT id FROM public.categories WHERE name = 'Automotive'), 'Tools & Equipment'),
  ((SELECT id FROM public.categories WHERE name = 'Automotive'), 'Spare Parts'),
  ((SELECT id FROM public.categories WHERE name = 'Automotive'), 'Lubricants & Oils'),
  ((SELECT id FROM public.categories WHERE name = 'Automotive'), 'Safety Equipment'),
  ((SELECT id FROM public.categories WHERE name = 'Automotive'), 'Car Electronics'),
  ((SELECT id FROM public.categories WHERE name = 'Automotive'), 'Tyres & Wheels'),

  -- Health & Wellness
  ((SELECT id FROM public.categories WHERE name = 'Health & Wellness'), 'Health Supplements'),
  ((SELECT id FROM public.categories WHERE name = 'Health & Wellness'), 'Medical Devices'),
  ((SELECT id FROM public.categories WHERE name = 'Health & Wellness'), 'Personal Hygiene'),
  ((SELECT id FROM public.categories WHERE name = 'Health & Wellness'), 'Wellness Products'),
  ((SELECT id FROM public.categories WHERE name = 'Health & Wellness'), 'Fitness Nutrition'),
  ((SELECT id FROM public.categories WHERE name = 'Health & Wellness'), 'Ayurvedic & Herbal'),
  ((SELECT id FROM public.categories WHERE name = 'Health & Wellness'), 'First Aid'),
  ((SELECT id FROM public.categories WHERE name = 'Health & Wellness'), 'Elder Care'),

  -- Jewellery & Accessories
  ((SELECT id FROM public.categories WHERE name = 'Jewellery & Accessories'), 'Fine Jewellery (Gold, Diamond)'),
  ((SELECT id FROM public.categories WHERE name = 'Jewellery & Accessories'), 'Silver Jewellery'),
  ((SELECT id FROM public.categories WHERE name = 'Jewellery & Accessories'), 'Fashion Jewellery'),
  ((SELECT id FROM public.categories WHERE name = 'Jewellery & Accessories'), 'Luxury Watches'),
  ((SELECT id FROM public.categories WHERE name = 'Jewellery & Accessories'), 'Precious Stones'),
  ((SELECT id FROM public.categories WHERE name = 'Jewellery & Accessories'), 'Gift Jewellery'),
  ((SELECT id FROM public.categories WHERE name = 'Jewellery & Accessories'), 'Bracelets & Bangles'),
  ((SELECT id FROM public.categories WHERE name = 'Jewellery & Accessories'), 'Rings & Earrings'),

  -- Grocery & Gourmet
  ((SELECT id FROM public.categories WHERE name = 'Grocery & Gourmet'), 'Staples (Rice, Flour, Pulses)'),
  ((SELECT id FROM public.categories WHERE name = 'Grocery & Gourmet'), 'Packaged Foods'),
  ((SELECT id FROM public.categories WHERE name = 'Grocery & Gourmet'), 'Snacks & Beverages'),
  ((SELECT id FROM public.categories WHERE name = 'Grocery & Gourmet'), 'Breakfast Foods'),
  ((SELECT id FROM public.categories WHERE name = 'Grocery & Gourmet'), 'Organic & Health Foods'),
  ((SELECT id FROM public.categories WHERE name = 'Grocery & Gourmet'), 'Baby Food'),
  ((SELECT id FROM public.categories WHERE name = 'Grocery & Gourmet'), 'Gourmet & Imported Foods'),
  ((SELECT id FROM public.categories WHERE name = 'Grocery & Gourmet'), 'Spices & Condiments'),

  -- Pet Supplies
  ((SELECT id FROM public.categories WHERE name = 'Pet Supplies'), 'Pet Food'),
  ((SELECT id FROM public.categories WHERE name = 'Pet Supplies'), 'Pet Toys'),
  ((SELECT id FROM public.categories WHERE name = 'Pet Supplies'), 'Pet Grooming'),
  ((SELECT id FROM public.categories WHERE name = 'Pet Supplies'), 'Pet Health & Wellness'),
  ((SELECT id FROM public.categories WHERE name = 'Pet Supplies'), 'Collars, Leashes & Harnesses'),
  ((SELECT id FROM public.categories WHERE name = 'Pet Supplies'), 'Beds & Furniture'),
  ((SELECT id FROM public.categories WHERE name = 'Pet Supplies'), 'Aquarium & Fish Supplies'),
  ((SELECT id FROM public.categories WHERE name = 'Pet Supplies'), 'Bird Supplies')
ON CONFLICT (category_id, name) DO NOTHING;
