-- ============================================================
-- DjossFood Triggers and Functions
-- ============================================================

-- ============================================================
-- 1. update_updated_at() — auto-update updated_at on row change
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. recalculate_restaurant_rating() — update restaurant
--    base_rating and rating_count after rating insert/update
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_restaurant_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE restaurants
  SET
    base_rating = (
      SELECT COALESCE(AVG(restaurant_rating), 0)::DECIMAL(3,2)
      FROM ratings
      WHERE restaurant_id = NEW.restaurant_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings
      WHERE restaurant_id = NEW.restaurant_id
    )
  WHERE id = NEW.restaurant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_restaurant_rating
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION recalculate_restaurant_rating();

-- ============================================================
-- 3. recalculate_driver_rating() — update driver rating
--    and rating_count after rating insert/update (only when
--    driver_id IS NOT NULL)
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_driver_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL THEN
    UPDATE drivers
    SET
      rating = (
        SELECT COALESCE(AVG(driver_rating), 0)::DECIMAL(3,2)
        FROM ratings
        WHERE driver_id = NEW.driver_id
      ),
      rating_count = (
        SELECT COUNT(*)
        FROM ratings
        WHERE driver_id = NEW.driver_id
      )
    WHERE id = NEW.driver_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_driver_rating
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION recalculate_driver_rating();

-- ============================================================
-- 4. stamp_order_status_change() — set status timestamps
--    automatically on order status transitions
-- ============================================================
CREATE OR REPLACE FUNCTION stamp_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    CASE NEW.status
      WHEN 'confirmed'        THEN NEW.confirmed_at        = NOW();
      WHEN 'preparing'        THEN NEW.preparing_started_at = NOW();
      WHEN 'ready'            THEN NEW.ready_at             = NOW();
      WHEN 'driver_assigned'  THEN NEW.driver_assigned_at  = NOW();
      WHEN 'picked_up'        THEN NEW.picked_up_at         = NOW();
      WHEN 'delivered'        THEN NEW.delivered_at         = NOW();
      WHEN 'completed'        THEN NEW.completed_at         = NOW();
      WHEN 'cancelled'        THEN NEW.cancelled_at         = NOW();
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stamp_order_status_change
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION stamp_order_status_change();

-- ============================================================
-- 5. handle_new_user() — insert a profile row when a new
--    user signs up in auth.users (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 6. search_restaurants() — full-text + geolocation search
-- ============================================================
CREATE OR REPLACE FUNCTION search_restaurants(
  p_query    TEXT,
  p_city     TEXT DEFAULT NULL,
  p_user_lat DECIMAL DEFAULT NULL,
  p_user_lng DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  id               UUID,
  name             TEXT,
  description      TEXT,
  city             TEXT,
  address          TEXT,
  phone            VARCHAR,
  cuisine_types    TEXT[],
  total_rating     DECIMAL,
  rating_count     INTEGER,
  min_order_amount INTEGER,
  distance_km      DECIMAL,
  matching_items   TEXT
) AS $$
  SELECT
    r.id,
    r.name,
    r.description,
    r.city,
    r.address,
    r.phone,
    r.cuisine_types,
    r.total_rating,
    r.rating_count,
    r.min_order_amount,
    CASE
      WHEN p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL
      THEN (
        ST_Distance(
          r.location,
          ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
        ) / 1000
      )::DECIMAL
      ELSE NULL
    END AS distance_km,
    (
      SELECT STRING_AGG(mi.name, ', ')
      FROM menu_items mi
      WHERE mi.restaurant_id = r.id
        AND mi.is_available = TRUE
        AND to_tsvector('french', COALESCE(mi.name, '') || ' ' || COALESCE(mi.description, ''))
            @@ plainto_tsquery('french', p_query)
    ) AS matching_items
  FROM restaurants r
  WHERE r.is_active = TRUE
    AND r.is_approved = TRUE
    AND (p_city IS NULL OR r.city ILIKE '%' || p_city || '%')
    AND (
      to_tsvector('french', COALESCE(r.name, '') || ' ' || COALESCE(r.description, ''))
        @@ plainto_tsquery('french', p_query)
      OR EXISTS (
        SELECT 1 FROM menu_items mi
        WHERE mi.restaurant_id = r.id
          AND mi.is_available = TRUE
          AND to_tsvector('french', COALESCE(mi.name, '') || ' ' || COALESCE(mi.description, ''))
              @@ plainto_tsquery('french', p_query)
      )
      OR r.cuisine_types && ARRAY[p_query]
    )
  ORDER BY r.total_rating DESC;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- 7. find_nearby_drivers() — locate available approved
--    drivers within a radius of a given restaurant
-- ============================================================
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  p_restaurant_id UUID,
  p_radius_km     DECIMAL DEFAULT 5.0
)
RETURNS TABLE (
  id           UUID,
  full_name    TEXT,
  phone        VARCHAR,
  vehicle_type TEXT,
  rating       DECIMAL,
  distance_km  DECIMAL
) AS $$
  SELECT
    d.id,
    p.full_name,
    p.phone,
    d.vehicle_type,
    d.rating,
    (ST_Distance(
      d.current_location,
      (SELECT location FROM restaurants WHERE id = p_restaurant_id)
    ) / 1000)::DECIMAL AS distance_km
  FROM drivers d
  JOIN profiles p ON p.id = d.id
  WHERE d.is_approved = TRUE
    AND d.status = 'available'
    AND d.current_location IS NOT NULL
    AND ST_DWithin(
      d.current_location,
      (SELECT location FROM restaurants WHERE id = p_restaurant_id),
      p_radius_km * 1000
    )
  ORDER BY distance_km ASC, d.rating DESC;
$$ LANGUAGE sql STABLE;