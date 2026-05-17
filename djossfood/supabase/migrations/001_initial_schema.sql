-- ============================================================
-- DjossFood Initial Schema Migration
-- ============================================================

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- Enum Types
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'client',
  'driver',
  'restaurant_owner',
  'admin'
);

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'driver_assigned',
  'picked_up',
  'delivered',
  'completed',
  'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'mobile_money',
  'card'
);

CREATE TYPE driver_status AS ENUM (
  'offline',
  'available',
  'busy',
  'on_delivery'
);

CREATE TYPE restaurant_status AS ENUM (
  'closed',
  'open',
  'busy',
  'temporarily_closed'
);

-- ============================================================
-- Tables
-- ============================================================

-- -----------------------------------------------------------
-- Profiles (extends auth.users)
-- -----------------------------------------------------------
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       VARCHAR(20),
  role        user_role NOT NULL DEFAULT 'client',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Restaurants
-- -----------------------------------------------------------
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
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Menu Categories
-- -----------------------------------------------------------
CREATE TABLE menu_categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Menu Items
-- -----------------------------------------------------------
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

-- -----------------------------------------------------------
-- Drivers
-- -----------------------------------------------------------
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

-- -----------------------------------------------------------
-- Orders
-- ------------------------------------------------===========
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

-- -----------------------------------------------------------
-- Order Items
-- -----------------------------------------------------------
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

-- -----------------------------------------------------------
-- Ratings
-- -----------------------------------------------------------
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

-- -----------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------
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

-- -----------------------------------------------------------
-- Payment Transactions
-- -----------------------------------------------------------
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

-- -----------------------------------------------------------
-- Admin Actions
-- -----------------------------------------------------------
CREATE TABLE admin_actions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id     UUID NOT NULL REFERENCES profiles(id),
  target_type  TEXT NOT NULL,
  target_id    UUID NOT NULL,
  action       TEXT NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- Search Logs
-- -----------------------------------------------------------
CREATE TABLE search_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  query           TEXT NOT NULL,
  city            TEXT,
  results_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

-- Restaurants
CREATE INDEX idx_restaurants_location ON restaurants USING GIST (location);
CREATE INDEX idx_restaurants_city ON restaurants (city);
CREATE INDEX idx_restaurants_total_rating ON restaurants (total_rating DESC);

-- Menu Items (French full-text search)
CREATE INDEX idx_menu_items_fts ON menu_items USING GIN (
  to_tsvector('french', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);
CREATE INDEX idx_menu_items_restaurant_id ON menu_items (restaurant_id);
CREATE INDEX idx_menu_items_category_id ON menu_items (category_id);

-- Orders
CREATE INDEX idx_orders_client_id ON orders (client_id);
CREATE INDEX idx_orders_restaurant_id ON orders (restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders (driver_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_expires_pending ON orders (expires_at) WHERE status = 'pending';

-- Drivers
CREATE INDEX idx_drivers_current_location ON drivers USING GIST (current_location);
CREATE INDEX idx_drivers_status ON drivers (status);

-- Notifications
CREATE INDEX idx_notifications_recipient_read ON notifications (recipient_id, is_read);

-- Ratings
CREATE INDEX idx_ratings_restaurant_id ON ratings (restaurant_id);
CREATE INDEX idx_ratings_driver_id ON ratings (driver_id);