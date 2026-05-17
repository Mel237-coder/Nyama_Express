-- ============================================================
-- DjossFood Row-Level Security Policies
-- ============================================================

-- ============================================================
-- Enable RLS on ALL tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Profiles Policies
-- ============================================================
CREATE POLICY "profiles_self" ON profiles
  FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "profiles_admin" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT
  USING (role IN ('driver', 'restaurant_owner'));

-- ============================================================
-- Restaurants Policies
-- ============================================================
CREATE POLICY "restaurants_public_read" ON restaurants
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "restaurants_owner_write" ON restaurants
  FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "restaurants_admin" ON restaurants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Menu Categories Policies
-- ============================================================
CREATE POLICY "menu_categories_public_read" ON menu_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_categories.restaurant_id
      AND restaurants.is_active = TRUE
    )
  );

CREATE POLICY "menu_categories_owner_write" ON menu_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_categories.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "menu_categories_admin" ON menu_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Menu Items Policies
-- ============================================================
CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_items.restaurant_id
      AND restaurants.is_active = TRUE
    )
  );

CREATE POLICY "menu_items_owner_write" ON menu_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_items.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "menu_items_admin" ON menu_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Orders Policies
-- ============================================================
CREATE POLICY "orders_client" ON orders
  FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY "orders_restaurant" ON orders
  FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "orders_driver" ON orders
  FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "orders_admin" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Order Items Policies
-- ============================================================
CREATE POLICY "order_items_client" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.client_id = auth.uid()
    )
  );

CREATE POLICY "order_items_restaurant" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.id = order_items.order_id
      AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "order_items_driver" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.driver_id = auth.uid()
    )
  );

CREATE POLICY "order_items_admin" ON order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Drivers Policies
-- ============================================================
CREATE POLICY "drivers_self" ON drivers
  FOR ALL
  USING (id = auth.uid());

CREATE POLICY "drivers_admin" ON drivers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Ratings Policies
-- ============================================================
CREATE POLICY "ratings_public_read" ON ratings
  FOR SELECT
  USING (TRUE);

CREATE POLICY "ratings_client_create" ON ratings
  FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "ratings_admin" ON ratings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Notifications Policies
-- ============================================================
CREATE POLICY "notifs_self" ON notifications
  FOR ALL
  USING (recipient_id = auth.uid());

-- ============================================================
-- Payment Transactions Policies
-- ============================================================
CREATE POLICY "payment_transactions_client" ON payment_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_transactions.order_id
      AND orders.client_id = auth.uid()
    )
  );

CREATE POLICY "payment_transactions_restaurant" ON payment_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.id = payment_transactions.order_id
      AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "payment_transactions_admin" ON payment_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Admin Actions Policies
-- ============================================================
CREATE POLICY "admin_actions_admin" ON admin_actions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Search Logs Policies
-- ============================================================
CREATE POLICY "search_logs_self" ON search_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "search_logs_admin" ON search_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "search_logs_insert" ON search_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);