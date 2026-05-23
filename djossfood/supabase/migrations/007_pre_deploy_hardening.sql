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
