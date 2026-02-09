-- ============================================
-- 10. REMAINING TABLES — Orders, Addresses, Banners,
--     Promotions, Complaints, Payouts, Accounting,
--     Wishlists, Cart, Audit Logs, Notifications
-- ============================================
-- Run AFTER 09_products.sql
-- Depends on: profiles, products, categories
-- ============================================


-- ─────────────────────────────────────────────
-- 10.1  USER ADDRESSES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  email text DEFAULT '',
  country text NOT NULL DEFAULT 'India',
  street_address_1 text NOT NULL,
  street_address_2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  address_type text DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
  delivery_notes text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON public.user_addresses FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses"
  ON public.user_addresses FOR SELECT
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.2  ORDERS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('ORD-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned')),
  total_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  payment_status text DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_intent_id text,
  tracking_number text,
  shipping_address jsonb,
  billing_address jsonb,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Sellers can see orders assigned to them
CREATE POLICY "Sellers can view their orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = seller_id);

-- Sellers can update orders assigned to them (status, tracking)
CREATE POLICY "Sellers can update their orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = seller_id);

-- Buyers can create orders
CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins full access on orders"
  ON public.orders FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.3  ORDER ITEMS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  variant_info jsonb,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Inherit visibility from orders
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access on order items"
  ON public.order_items FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.4  CART ITEMS (server-side cart)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variant_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 10.5  WISHLISTS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist"
  ON public.wishlists FOR ALL
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- 10.6  BANNERS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link text,
  is_active boolean DEFAULT true,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public read for active banners
CREATE POLICY "Anyone can view active banners"
  ON public.banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins full access on banners"
  ON public.banners FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.7  PROMOTIONS / COUPONS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  applicable_to text DEFAULT 'common' CHECK (applicable_to IN ('user', 'seller', 'common')),
  applicable_ids uuid[] DEFAULT '{}',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  max_uses integer,
  current_uses integer DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Public read for active promotions
CREATE POLICY "Anyone can view active promotions"
  ON public.promotions FOR SELECT
  USING (is_active = true AND now() BETWEEN start_date AND end_date);

CREATE POLICY "Admins full access on promotions"
  ON public.promotions FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.8  COMPLAINTS / SUPPORT TICKETS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own complaints"
  ON public.complaints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access on complaints"
  ON public.complaints FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.9  SELLER PAYOUTS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.seller_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'INR',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'failed')),
  payout_method text DEFAULT 'bank_transfer',
  bank_reference text,
  scheduled_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER seller_payouts_updated_at
  BEFORE UPDATE ON public.seller_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own payouts"
  ON public.seller_payouts FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins full access on payouts"
  ON public.seller_payouts FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.10  WITHDRAWALS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'INR',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'failed', 'cancelled')),
  bank_details jsonb,
  admin_notes text,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can manage own withdrawals"
  ON public.withdrawals FOR ALL
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins full access on withdrawals"
  ON public.withdrawals FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.11  NOTIFICATIONS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'order', 'promotion', 'system')),
  is_read boolean DEFAULT false,
  link text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins full access on notifications"
  ON public.notifications FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.12  AUDIT LOGS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);


-- ─────────────────────────────────────────────
-- 10.13  ACCOUNTING — DAYBOOK ENTRIES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daybook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  reference text,
  account_head_id uuid,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.daybook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on daybook"
  ON public.daybook_entries FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.14  ACCOUNTING — BANK BOOK ENTRIES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bank_book_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  bank_reference text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bank_book_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on bank book"
  ON public.bank_book_entries FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.15  ACCOUNTING — ACCOUNT HEADS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.account_heads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('asset', 'liability', 'income', 'expense')),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.account_heads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on account heads"
  ON public.account_heads FOR ALL
  USING (public.get_my_role() = 'admin');

-- Seed default account heads
INSERT INTO public.account_heads (name, type, description) VALUES
  ('Sales Revenue',    'income',   'Revenue from product sales'),
  ('Platform Fees',    'income',   'Commission and platform fees collected'),
  ('Seller Payouts',   'expense',  'Payments made to sellers'),
  ('Refunds',          'expense',  'Refunds issued to customers'),
  ('Operating Costs',  'expense',  'General operating expenses'),
  ('Cash & Bank',      'asset',    'Cash and bank balances'),
  ('Accounts Payable', 'liability','Amounts owed to sellers')
ON CONFLICT (name) DO NOTHING;


-- ─────────────────────────────────────────────
-- 10.16  ACCOUNTING — EXPENSE ENTRIES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.expense_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL,
  description text,
  vendor text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  account_head_id uuid REFERENCES public.account_heads(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER expense_entries_updated_at
  BEFORE UPDATE ON public.expense_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on expenses"
  ON public.expense_entries FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.17  MEMBERSHIP PLANS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'INR',
  duration_days integer NOT NULL DEFAULT 30,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER membership_plans_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Public read for active plans
CREATE POLICY "Anyone can view active plans"
  ON public.membership_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins full access on plans"
  ON public.membership_plans FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.18  TAX RULES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  country text,
  state text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER tax_rules_updated_at
  BEFORE UPDATE ON public.tax_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tax rules"
  ON public.tax_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins full access on tax rules"
  ON public.tax_rules FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.19  PLATFORM COSTS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.platform_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'INR',
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'one_time')),
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER platform_costs_updated_at
  BEFORE UPDATE ON public.platform_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.platform_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on platform costs"
  ON public.platform_costs FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.20  PAYMENT INTENTS (Stripe / Payment Gateway)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id text UNIQUE,
  client_secret text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_email text,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'INR',
  status text DEFAULT 'requires_payment_method'
    CHECK (status IN ('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment intents"
  ON public.payment_intents FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins full access on payment intents"
  ON public.payment_intents FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.21  PAYMENT REFUNDS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_refund_id text UNIQUE,
  payment_intent_id uuid REFERENCES public.payment_intents(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'INR',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  reason text CHECK (reason IN ('duplicate', 'fraudulent', 'requested_by_customer', 'abandoned')),
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER payment_refunds_updated_at
  BEFORE UPDATE ON public.payment_refunds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own refunds"
  ON public.payment_refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payment_refunds.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access on refunds"
  ON public.payment_refunds FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.22  CHECKOUT SESSIONS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text UNIQUE,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_email text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'complete', 'expired')),
  success_url text,
  cancel_url text,
  items jsonb DEFAULT '[]',
  total_amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'INR',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 minutes')
);

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.checkout_sessions FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can create sessions"
  ON public.checkout_sessions FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins full access on sessions"
  ON public.checkout_sessions FOR ALL
  USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.23  BANNER IMAGES STORAGE BUCKET
-- ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view banner images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banner images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND public.get_my_role() = 'admin');

CREATE POLICY "Admins can update banner images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners' AND public.get_my_role() = 'admin');

CREATE POLICY "Admins can delete banner images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners' AND public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────
-- 10.24  USEFUL INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_user_id       ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id     ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id   ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id    ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id   ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_sid   ON public.seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_sid      ON public.withdrawals(seller_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created   ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_cust ON public.payment_intents(customer_id);
CREATE INDEX IF NOT EXISTS idx_banners_position     ON public.banners(position);
CREATE INDEX IF NOT EXISTS idx_promotions_active    ON public.promotions(is_active, start_date, end_date);
