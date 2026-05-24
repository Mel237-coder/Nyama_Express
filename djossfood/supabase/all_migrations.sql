-- ============================================================
-- DjossFood — ALL MIGRATIONS + SEED (Consolidé)
-- Exécutez ce fichier ENTIER dans Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 0. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- 1. Enum Types
-- ============================================================
CREATE TYPE user_role AS ENUM ('client', 'driver', 'restaurant_owner', 'admin');

CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'ready', 'driver_assigned',
  'picked_up', 'delivered', 'completed', 'cancelled', 'rejected'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'paid', 'failed', 'refunded', 'partial', 'completed'
);

CREATE TYPE payment_method AS ENUM ('cash', 'mobile_money', 'card');

CREATE TYPE driver_status AS ENUM ('offline', 'available', 'busy', 'on_delivery');

CREATE TYPE restaurant_status AS ENUM ('closed', 'open', 'busy', 'temporarily_closed');

-- ============================================================
-- 2. Tables
-- ============================================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       VARCHAR(20),
  role        user_role NOT NULL DEFAULT 'client',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE restaurants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  city              TEXT NOT NULL,
  address           TEXT NOT NULL,
  location          GEOGRAPHY(POINT, 4326),
  phone             VARCHAR(20),
  email             TEXT,
  cuisine_types     TEXT[] DEFAULT '{}',
  opening_hours     JSONB DEFAULT '{}',
  image_url         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved       BOOLEAN NOT NULL DEFAULT FALSE,
  status            restaurant_status NOT NULL DEFAULT 'closed',
  base_rating       DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  admin_boost       DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_rating      DECIMAL(3,2) GENERATED ALWAYS AS (LEAST(base_rating + admin_boost, 5.00)) STORED,
  rating_count      INTEGER NOT NULL DEFAULT 0,
  min_order_amount  INTEGER NOT NULL DEFAULT 0,
  wallet_balance    INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_items (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id             UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  restaurant_id           UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  description             TEXT,
  price                   INTEGER NOT NULL,
  image_url               TEXT,
  is_available            BOOLEAN NOT NULL DEFAULT TRUE,
  preparation_time_minutes INTEGER,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE drivers (
  id                UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type      TEXT,
  vehicle_plate     TEXT,
  current_location  GEOGRAPHY(POINT, 4326),
  status            driver_status NOT NULL DEFAULT 'offline',
  rating            DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count      INTEGER NOT NULL DEFAULT 0,
  wallet_balance    INTEGER NOT NULL DEFAULT 0,
  is_approved       BOOLEAN NOT NULL DEFAULT FALSE,
  documents         JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number          SERIAL UNIQUE,
  client_id             UUID NOT NULL REFERENCES profiles(id),
  restaurant_id         UUID NOT NULL REFERENCES restaurants(id),
  driver_id             UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status                order_status NOT NULL DEFAULT 'pending',
  subtotal              INTEGER NOT NULL,
  delivery_fee          INTEGER NOT NULL DEFAULT 0,
  total_amount          INTEGER NOT NULL,
  payment_method        payment_method,
  payment_status        payment_status NOT NULL DEFAULT 'pending',
  delivery_location     GEOGRAPHY(POINT, 4326),
  delivery_address      TEXT,
  route_distance_km     DECIMAL(5,2),
  route_duration_minutes INTEGER,
  notes                 TEXT,
  cancellation_reason   TEXT,
  confirmed_at          TIMESTAMPTZ,
  preparing_started_at  TIMESTAMPTZ,
  ready_at              TIMESTAMPTZ,
  driver_assigned_at    TIMESTAMPTZ,
  picked_up_at          TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id          UUID NOT NULL REFERENCES menu_items(id),
  quantity              INTEGER NOT NULL CHECK (quantity > 0),
  unit_price            INTEGER NOT NULL,
  subtotal              INTEGER NOT NULL,
  special_instructions  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ratings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id         UUID NOT NULL REFERENCES profiles(id),
  restaurant_id      UUID NOT NULL REFERENCES restaurants(id),
  driver_id           UUID REFERENCES drivers(id) ON DELETE SET NULL,
  restaurant_rating   INTEGER NOT NULL CHECK (restaurant_rating BETWEEN 1 AND 5),
  driver_rating      INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
  comment             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  type          TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  data          JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_transactions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id               UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount                 INTEGER NOT NULL,
  payment_method         payment_method NOT NULL,
  payment_status         payment_status NOT NULL DEFAULT 'pending',
  transaction_reference  TEXT,
  phone                  VARCHAR(20),
  provider_response      JSONB DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_actions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id      UUID NOT NULL REFERENCES profiles(id),
  target_type   TEXT NOT NULL,
  target_id     UUID NOT NULL,
  action        TEXT NOT NULL,
  action_type   TEXT,
  previous_value JSONB,
  new_value     JSONB,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE search_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  query           TEXT NOT NULL,
  city            TEXT,
  results_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX idx_restaurants_location ON restaurants USING GIST (location);
CREATE INDEX idx_restaurants_city ON restaurants (city);
CREATE INDEX idx_restaurants_total_rating ON restaurants (total_rating DESC);
CREATE INDEX idx_menu_items_fts ON menu_items USING GIN (to_tsvector('french', COALESCE(name, '') || ' ' || COALESCE(description, '')));
CREATE INDEX idx_menu_items_restaurant_id ON menu_items (restaurant_id);
CREATE INDEX idx_menu_items_category_id ON menu_items (category_id);
CREATE INDEX idx_orders_client_id ON orders (client_id);
CREATE INDEX idx_orders_restaurant_id ON orders (restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders (driver_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_expires_pending ON orders (expires_at) WHERE status = 'pending';
CREATE INDEX idx_drivers_current_location ON drivers USING GIST (current_location);
CREATE INDEX idx_drivers_status ON drivers (status);
CREATE INDEX idx_notifications_recipient_read ON notifications (recipient_id, is_read);
CREATE INDEX idx_ratings_restaurant_id ON ratings (restaurant_id);
CREATE INDEX idx_ratings_driver_id ON ratings (driver_id);

-- ============================================================
-- 4. RLS Policies
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

CREATE POLICY "profiles_self" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin" ON profiles FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (role IN ('driver', 'restaurant_owner'));

CREATE POLICY "restaurants_public_read" ON restaurants FOR SELECT USING (is_active = TRUE);
CREATE POLICY "restaurants_owner_write" ON restaurants FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "restaurants_admin" ON restaurants FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "menu_categories_public_read" ON menu_categories FOR SELECT USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_categories.restaurant_id AND restaurants.is_active = TRUE));
CREATE POLICY "menu_categories_owner_write" ON menu_categories FOR ALL USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_categories.restaurant_id AND restaurants.owner_id = auth.uid()));
CREATE POLICY "menu_categories_admin" ON menu_categories FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "menu_items_public_read" ON menu_items FOR SELECT USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND restaurants.is_active = TRUE));
CREATE POLICY "menu_items_owner_write" ON menu_items FOR ALL USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND restaurants.owner_id = auth.uid()));
CREATE POLICY "menu_items_admin" ON menu_items FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "orders_client" ON orders FOR ALL USING (client_id = auth.uid());
CREATE POLICY "orders_restaurant" ON orders FOR SELECT USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "orders_driver" ON orders FOR SELECT USING (driver_id = auth.uid());
CREATE POLICY "orders_admin" ON orders FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "order_items_client" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.client_id = auth.uid()));
CREATE POLICY "order_items_restaurant" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders o JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = order_items.order_id AND r.owner_id = auth.uid()));
CREATE POLICY "order_items_driver" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.driver_id = auth.uid()));
CREATE POLICY "order_items_admin" ON order_items FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "drivers_self" ON drivers FOR ALL USING (id = auth.uid());
CREATE POLICY "drivers_admin" ON drivers FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "ratings_public_read" ON ratings FOR SELECT USING (TRUE);
CREATE POLICY "ratings_client_create" ON ratings FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "ratings_admin" ON ratings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "notifs_self" ON notifications FOR ALL USING (recipient_id = auth.uid());

CREATE POLICY "payment_transactions_client" ON payment_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.client_id = auth.uid()));
CREATE POLICY "payment_transactions_restaurant" ON payment_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM orders o JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = payment_transactions.order_id AND r.owner_id = auth.uid()));
CREATE POLICY "payment_transactions_admin" ON payment_transactions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_actions_admin" ON admin_actions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "search_logs_self" ON search_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "search_logs_admin" ON search_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "search_logs_insert" ON search_logs FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================
-- 5. Triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION recalculate_restaurant_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE restaurants SET
    base_rating = (SELECT COALESCE(AVG(restaurant_rating), 0)::DECIMAL(3,2) FROM ratings WHERE restaurant_id = NEW.restaurant_id),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE restaurant_id = NEW.restaurant_id)
  WHERE id = NEW.restaurant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_recalculate_restaurant_rating AFTER INSERT OR UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION recalculate_restaurant_rating();

CREATE OR REPLACE FUNCTION recalculate_driver_rating() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL THEN
    UPDATE drivers SET
      rating = (SELECT COALESCE(AVG(driver_rating), 0)::DECIMAL(3,2) FROM ratings WHERE driver_id = NEW.driver_id),
      rating_count = (SELECT COUNT(*) FROM ratings WHERE driver_id = NEW.driver_id)
    WHERE id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_recalculate_driver_rating AFTER INSERT OR UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION recalculate_driver_rating();

CREATE OR REPLACE FUNCTION stamp_order_status_change() RETURNS TRIGGER AS $$
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
CREATE TRIGGER trigger_stamp_order_status_change BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION stamp_order_status_change();

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
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
CREATE TRIGGER trigger_handle_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION search_restaurants(p_query TEXT, p_city TEXT DEFAULT NULL, p_user_lat DECIMAL DEFAULT NULL, p_user_lng DECIMAL DEFAULT NULL)
RETURNS TABLE (id UUID, name TEXT, description TEXT, city TEXT, address TEXT, phone VARCHAR, cuisine_types TEXT[], total_rating DECIMAL, rating_count INTEGER, min_order_amount INTEGER, distance_km DECIMAL, matching_items TEXT) AS $$
  SELECT
    r.id, r.name, r.description, r.city, r.address, r.phone, r.cuisine_types, r.total_rating, r.rating_count, r.min_order_amount,
    CASE WHEN p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN (ST_Distance(r.location, ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography) / 1000)::DECIMAL ELSE NULL END AS distance_km,
    (SELECT STRING_AGG(mi.name, ', ') FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.is_available = TRUE AND to_tsvector('french', COALESCE(mi.name, '') || ' ' || COALESCE(mi.description, '')) @@ plainto_tsquery('french', p_query)) AS matching_items
  FROM restaurants r
  WHERE r.is_active = TRUE AND r.is_approved = TRUE AND (p_city IS NULL OR r.city ILIKE '%' || p_city || '%')
    AND (to_tsvector('french', COALESCE(r.name, '') || ' ' || COALESCE(r.description, '')) @@ plainto_tsquery('french', p_query)
      OR EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.is_available = TRUE AND to_tsvector('french', COALESCE(mi.name, '') || ' ' || COALESCE(mi.description, '')) @@ plainto_tsquery('french', p_query))
      OR r.cuisine_types && ARRAY[p_query])
  ORDER BY r.total_rating DESC;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION find_nearby_drivers(p_restaurant_id UUID, p_radius_km DECIMAL DEFAULT 5.0)
RETURNS TABLE (id UUID, full_name TEXT, phone VARCHAR, vehicle_type TEXT, rating DECIMAL, distance_km DECIMAL) AS $$
  SELECT d.id, p.full_name, p.phone, d.vehicle_type, d.rating,
    (ST_Distance(d.current_location, (SELECT location FROM restaurants WHERE id = p_restaurant_id)) / 1000)::DECIMAL AS distance_km
  FROM drivers d JOIN profiles p ON p.id = d.id
  WHERE d.is_approved = TRUE AND d.status = 'available' AND d.current_location IS NOT NULL
    AND ST_DWithin(d.current_location, (SELECT location FROM restaurants WHERE id = p_restaurant_id), p_radius_km * 1000)
  ORDER BY distance_km ASC, d.rating DESC;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- 6. Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;

-- ============================================================
-- 7. Seed Data
-- ============================================================
ALTER TABLE auth.users DISABLE TRIGGER trigger_handle_new_user;

INSERT INTO profiles (id, full_name, phone, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin DjossFood', '+237699999999', 'admin'),
  ('c0000000-0000-0000-0000-000000000001', 'Jean Kamga',       '+237677123456', 'client'),
  ('c0000000-0000-0000-0000-000000000002', 'Marie Nkoulou',     '+237677234567', 'client'),
  ('c0000000-0000-0000-0000-000000000003', 'Paul Essomba',      '+237677345678', 'client'),
  ('r0000000-0000-0000-0000-000000000001', 'Maman Ngono',  '+237688123456', 'restaurant_owner'),
  ('r0000000-0000-0000-0000-000000000002', 'Laurent Fotso', '+237688234567', 'restaurant_owner'),
  ('d0000000-0000-0000-0000-000000000001', 'Emmanuel Fopa',  '+237699111111', 'driver'),
  ('d0000000-0000-0000-0000-000000000002', 'Alain Tchinda',  '+237699222222', 'driver');

INSERT INTO restaurants (id, owner_id, name, description, city, address, location, phone, email, cuisine_types, is_active, is_approved, status, base_rating, admin_boost, min_order_amount) VALUES
  ('11111111-1111-1111-1111-111111111111', 'r0000000-0000-0000-0000-000000000001', 'Chez Mama Ngono', 'Cuisine camerounaise traditionnelle — les meilleurs plats faits maison à Yaoundé', 'Yaoundé', 'Quartier Bastos, Rue 1.851, Yaoundé', ST_SetSRID(ST_MakePoint(11.5021, 3.8480), 4326)::geography, '+237688123456', 'contact@chezmangono.cm', ARRAY['Camerounais', 'Traditionnel', 'Soupe'], TRUE, TRUE, 'open', 4.20, 0.30, 1000),
  ('22222222-2222-2222-2222-222222222222', 'r0000000-0000-0000-0000-000000000002', 'Douala Pizza Express', 'Pizzas et fast-food — livraison rapide à Yaoundé', 'Yaoundé', 'Quartier Bonapriso, Avenue de la République, Yaoundé', ST_SetSRID(ST_MakePoint(11.5100, 3.8550), 4326)::geography, '+237688234567', 'info@doualapizza.cm', ARRAY['Pizza', 'Fast-food', 'Burgers'], TRUE, TRUE, 'open', 3.80, 0.50, 1500),
  ('33333333-3333-3333-3333-333333333333', 'r0000000-0000-0000-0000-000000000002', 'Wok Asiatique Yaoundé', 'Cuisine asiatique authentique au cœur de Yaoundé', 'Yaoundé', 'Quartier Nlongkak, Rue 2.401, Yaoundé', ST_SetSRID(ST_MakePoint(11.5050, 3.8520), 4326)::geography, '+237688234567', 'contact@wokasiatique.cm', ARRAY['Asiatique', 'Chinois', 'Japonais'], TRUE, TRUE, 'open', 3.50, 0.00, 2000);

INSERT INTO menu_categories (id, restaurant_id, name, display_order) VALUES
  ('ca111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Soupes Traditionnelles', 1),
  ('ca111111-2222-2222-2222-111111111111', '11111111-1111-1111-1111-111111111111', 'Plats Principaux',       2),
  ('ca111111-3333-3333-3333-111111111111', '11111111-1111-1111-1111-111111111111', 'Accompagnements',        3),
  ('ca222222-1111-1111-1111-222222222222', '22222222-2222-2222-2222-222222222222', 'Pizzas',    1),
  ('ca222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Burgers',   2),
  ('ca222222-3333-3333-3333-222222222222', '22222222-2222-2222-2222-222222222222', 'Boissons',  3),
  ('ca333333-1111-1111-1111-333333333333', '33333333-3333-3333-3333-333333333333', 'Entrées',  1),
  ('ca333333-2222-2222-2222-333333333333', '33333333-3333-3333-3333-333333333333', 'Plats',    2),
  ('ca333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Sushis',   3);

INSERT INTO menu_items (id, category_id, restaurant_id, name, description, price, is_available, preparation_time_minutes) VALUES
  ('mi111111-1111-1111-1111-111111111111', 'ca111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Ndolé',           'Feuilles de ndolé aux arachides grillées — plat populaire camerounais',  1200, TRUE, 20),
  ('mi111111-2222-2222-2222-111111111111', 'ca111111-2222-2222-2222-111111111111', '11111111-1111-1111-1111-111111111111', 'Poulet DG',       'Poulet rôti aux plantains mûrs et légumes — le classique camerounais', 2500, TRUE, 30),
  ('mi111111-3333-3333-3333-111111111111', 'ca111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Eru au waterleaf', 'Soupe d''eru au waterleaf et huile de palme',                             1000, TRUE, 20),
  ('mi111111-4444-4444-4444-111111111111', 'ca111111-2222-2222-2222-111111111111', '11111111-1111-1111-1111-111111111111', 'Kondré',          'Banane plantain bouillie à la sauce tomate épicée',                     800,  TRUE, 25),
  ('mi111111-5555-5555-5555-111111111111', 'ca111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Achu soup',       'Soupe jaune d''achu à l''huile de palme et viande de brousse',         700,  TRUE, 15),
  ('mi222222-1111-1111-1111-222222222222', 'ca222222-1111-1111-1111-222222222222', '22222222-2222-2222-2222-222222222222', 'Pizza Margherita',    'Pizza classique sauce tomate, mozzarella et basilic frais', 2500, TRUE, 20),
  ('mi222222-2222-2222-2222-222222222222', 'ca222222-1111-1111-1111-222222222222', '22222222-2222-2222-2222-222222222222', 'Pizza 4 Fromages',    'Pizza aux quatre fromages — mozzarella, gorgonzola, parmesan, gruyère', 3000, TRUE, 22),
  ('mi222222-3333-3333-3333-222222222222', 'ca222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Burger Classique',    'Burger boeuf grillé, salade, tomate, sauce maison',         1500, TRUE, 15),
  ('mi222222-4444-4444-4444-222222222222', 'ca222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Cheeseburger Double', 'Double steak, double fromage, oignons caramélisés',       2000, TRUE, 18),
  ('mi222222-5555-5555-5555-222222222222', 'ca222222-3333-3333-3333-222222222222', '22222222-2222-2222-2222-222222222222', 'Frites Maison',      'Frites croustillantes dorées — accompagnement parfait',    800,  TRUE, 10),
  ('mi333333-1111-1111-1111-333333333333', 'ca333333-1111-1111-1111-333333333333', '33333333-3333-3333-3333-333333333333', 'Nems au poulet',    'Rouleaux de printemps frits au poulet et légumes',      1000, TRUE, 15),
  ('mi333333-2222-2222-2222-333333333333', 'ca333333-2222-2222-2222-333333333333', '33333333-3333-3333-3333-333333333333', 'Riz Cantonais',      'Riz sauté aux crevettes, porc et légumes croquants',   1800, TRUE, 20),
  ('mi333333-3333-3333-3333-333333333333', 'ca333333-2222-2222-2222-333333333333', '33333333-3333-3333-3333-333333333333', 'Poulet au curry',    'Poulet mijoté au curry épicé à la sauce coco',         2200, TRUE, 25),
  ('mi333333-4444-4444-4444-333333333333', 'ca333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Sushi Mix Plate',   'Assortiment de makis et sashimi — 12 pièces',         3500, TRUE, 25),
  ('mi333333-5555-5555-5555-333333333333', 'ca333333-1111-1111-1111-333333333333', '33333333-3333-3333-3333-333333333333', 'Soupe Won Ton',     'Bouillon chaud aux raviolis crevettes et porc',        900,  TRUE, 15);

INSERT INTO drivers (id, vehicle_type, vehicle_plate, current_location, status, rating, wallet_balance, is_approved) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'moto', 'LT 1234 YA', ST_SetSRID(ST_MakePoint(11.5040, 3.8490), 4326)::geography, 'available', 4.50, 15000, TRUE),
  ('d0000000-0000-0000-0000-000000000002', 'moto', 'LT 5678 YA', ST_SetSRID(ST_MakePoint(11.5080, 3.8510), 4326)::geography, 'offline', 4.20, 8500, TRUE);

ALTER TABLE auth.users ENABLE TRIGGER trigger_handle_new_user;

-- ============================================================
-- DONE !
-- ============================================================
