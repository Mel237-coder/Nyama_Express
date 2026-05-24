-- Atomic wallet balance increment (prevents race conditions)
CREATE OR REPLACE FUNCTION increment_wallet_balance(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE drivers SET wallet_balance = wallet_balance + p_amount WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Atomic restaurant wallet balance increment
CREATE OR REPLACE FUNCTION increment_restaurant_wallet_balance(p_restaurant_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE restaurants SET wallet_balance = wallet_balance + p_amount WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql;

-- Atomic delivery count increment
CREATE OR REPLACE FUNCTION increment_driver_deliveries(p_driver_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE drivers SET total_deliveries = total_deliveries + 1 WHERE id = p_driver_id;
END;
$$ LANGUAGE plpgsql;

-- Prevent duplicate ratings per order
ALTER TABLE ratings ADD CONSTRAINT IF NOT EXISTS unique_order_rating UNIQUE (order_id);

-- Ensure order_items.subtotal is always positive
ALTER TABLE order_items ADD CONSTRAINT IF NOT EXISTS check_subtotal_positive CHECK (subtotal > 0);

-- Composite indexes for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_query ON search_logs(user_id, query);
