-- ============================================================
-- DjossFood Seed Data
-- Realistic test data for Cameroon (Yaoundé / Douala)
-- ============================================================

-- ============================================================
-- 0. Disable triggers that depend on auth.users during seeding
-- ============================================================
-- The handle_new_user trigger inserts into profiles when a row
-- is added to auth.users. Since we insert profiles directly,
-- we temporarily disable it.
ALTER TABLE auth.users DISABLE TRIGGER trigger_handle_new_user;

-- ============================================================
-- 1. Profiles
-- ============================================================

-- Admin
INSERT INTO profiles (id, full_name, phone, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin DjossFood', '+237699999999', 'admin');

-- Clients
INSERT INTO profiles (id, full_name, phone, role) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Jean Kamga',       '+237677123456', 'client'),
  ('c0000000-0000-0000-0000-000000000002', 'Marie Nkoulou',     '+237677234567', 'client'),
  ('c0000000-0000-0000-0000-000000000003', 'Paul Essomba',      '+237677345678', 'client');

-- Restaurant owners
INSERT INTO profiles (id, full_name, phone, role) VALUES
  ('r0000000-0000-0000-0000-000000000001', 'Maman Ngono',  '+237688123456', 'restaurant_owner'),
  ('r0000000-0000-0000-0000-000000000002', 'Laurent Fotso', '+237688234567', 'restaurant_owner');

-- Drivers
INSERT INTO profiles (id, full_name, phone, role) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Emmanuel Fopa',  '+237699111111', 'driver'),
  ('d0000000-0000-0000-0000-000000000002', 'Alain Tchinda',  '+237699222222', 'driver');

-- ============================================================
-- 2. Restaurants
-- ============================================================

INSERT INTO restaurants (id, owner_id, name, description, city, address, location, phone, email, cuisine_types, is_active, is_approved, status, base_rating, admin_boost, min_order_amount) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'r0000000-0000-0000-0000-000000000001',
    'Chez Mama Ngono',
    'Cuisine camerounaise traditionnelle — les meilleurs plats faits maison à Yaoundé',
    'Yaoundé',
    'Quartier Bastos, Rue 1.851, Yaoundé',
    ST_SetSRID(ST_MakePoint(11.5021, 3.8480), 4326)::geography,
    '+237688123456',
    'contact@chezmangono.cm',
    ARRAY['Camerounais', 'Traditionnel', 'Soupe'],
    TRUE, TRUE, 'open',
    4.20, 0.30, 1000
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'r0000000-0000-0000-0000-000000000002',
    'Douala Pizza Express',
    'Pizzas et fast-food — livraison rapide à Yaoundé',
    'Yaoundé',
    'Quartier Bonapriso, Avenue de la République, Yaoundé',
    ST_SetSRID(ST_MakePoint(11.5100, 3.8550), 4326)::geography,
    '+237688234567',
    'info@doualapizza.cm',
    ARRAY['Pizza', 'Fast-food', 'Burgers'],
    TRUE, TRUE, 'open',
    3.80, 0.50, 1500
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'r0000000-0000-0000-0000-000000000002',
    'Wok Asiatique Yaoundé',
    'Cuisine asiatique authentique au cœur de Yaoundé',
    'Yaoundé',
    'Quartier Nlongkak, Rue 2.401, Yaoundé',
    ST_SetSRID(ST_MakePoint(11.5050, 3.8520), 4326)::geography,
    '+237688234567',
    'contact@wokasiatique.cm',
    ARRAY['Asiatique', 'Chinois', 'Japonais'],
    TRUE, TRUE, 'open',
    3.50, 0.00, 2000
  );

-- ============================================================
-- 3. Menu Categories
-- ============================================================

-- Chez Mama Ngono categories
INSERT INTO menu_categories (id, restaurant_id, name, display_order) VALUES
  ('ca111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Soupes Traditionnelles', 1),
  ('ca111111-2222-2222-2222-111111111111', '11111111-1111-1111-1111-111111111111', 'Plats Principaux',       2),
  ('ca111111-3333-3333-3333-111111111111', '11111111-1111-1111-1111-111111111111', 'Accompagnements',        3);

-- Douala Pizza Express categories
INSERT INTO menu_categories (id, restaurant_id, name, display_order) VALUES
  ('ca222222-1111-1111-1111-222222222222', '22222222-2222-2222-2222-222222222222', 'Pizzas',    1),
  ('ca222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Burgers',   2),
  ('ca222222-3333-3333-3333-222222222222', '22222222-2222-2222-2222-222222222222', 'Boissons',  3);

-- Wok Asiatique Yaoundé categories
INSERT INTO menu_categories (id, restaurant_id, name, display_order) VALUES
  ('ca333333-1111-1111-1111-333333333333', '33333333-3333-3333-3333-333333333333', 'Entrées',  1),
  ('ca333333-2222-2222-2222-333333333333', '33333333-3333-3333-3333-333333333333', 'Plats',    2),
  ('ca333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Sushis',   3);

-- ============================================================
-- 4. Menu Items
-- ============================================================

-- Chez Mama Ngono items
INSERT INTO menu_items (id, category_id, restaurant_id, name, description, price, is_available, preparation_time_minutes) VALUES
  ('mi111111-1111-1111-1111-111111111111', 'ca111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Ndolé',           'Feuilles de ndolé aux arachides grillées — plat populaire camerounais',  1200, TRUE, 20),
  ('mi111111-2222-2222-2222-111111111111', 'ca111111-2222-2222-2222-111111111111', '11111111-1111-1111-1111-111111111111', 'Poulet DG',       'Poulet rôti aux plantains mûrs et légumes — le classique camerounais', 2500, TRUE, 30),
  ('mi111111-3333-3333-3333-111111111111', 'ca111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Eru au waterleaf', 'Soupe d''eru au waterleaf et huile de palme',                             1000, TRUE, 20),
  ('mi111111-4444-4444-4444-111111111111', 'ca111111-2222-2222-2222-111111111111', '11111111-1111-1111-1111-111111111111', 'Kondré',          'Banane plantain bouillie à la sauce tomate épicée',                     800,  TRUE, 25),
  ('mi111111-5555-5555-5555-111111111111', 'ca111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Achu soup',       'Soupe jaune d''achu à l''huile de palme et viande de brousse',         700,  TRUE, 15);

-- Douala Pizza Express items
INSERT INTO menu_items (id, category_id, restaurant_id, name, description, price, is_available, preparation_time_minutes) VALUES
  ('mi222222-1111-1111-1111-222222222222', 'ca222222-1111-1111-1111-222222222222', '22222222-2222-2222-2222-222222222222', 'Pizza Margherita',    'Pizza classique sauce tomate, mozzarella et basilic frais', 2500, TRUE, 20),
  ('mi222222-2222-2222-2222-222222222222', 'ca222222-1111-1111-1111-222222222222', '22222222-2222-2222-2222-222222222222', 'Pizza 4 Fromages',    'Pizza aux quatre fromages — mozzarella, gorgonzola, parmesan, gruyère', 3000, TRUE, 22),
  ('mi222222-3333-3333-3333-222222222222', 'ca222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Burger Classique',    'Burger boeuf grillé, salade, tomate, sauce maison',         1500, TRUE, 15),
  ('mi222222-4444-4444-4444-222222222222', 'ca222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Cheeseburger Double', 'Double steak, double fromage, oignons caramélisés',       2000, TRUE, 18),
  ('mi222222-5555-5555-5555-222222222222', 'ca222222-3333-3333-3333-222222222222', '22222222-2222-2222-2222-222222222222', 'Frites Maison',      'Frites croustillantes dorées — accompagnement parfait',    800,  TRUE, 10);

-- Wok Asiatique Yaoundé items
INSERT INTO menu_items (id, category_id, restaurant_id, name, description, price, is_available, preparation_time_minutes) VALUES
  ('mi333333-1111-1111-1111-333333333333', 'ca333333-1111-1111-1111-333333333333', '33333333-3333-3333-3333-333333333333', 'Nems au poulet',    'Rouleaux de printemps frits au poulet et légumes',      1000, TRUE, 15),
  ('mi333333-2222-2222-2222-333333333333', 'ca333333-2222-2222-2222-333333333333', '33333333-3333-3333-3333-333333333333', 'Riz Cantonais',      'Riz sauté aux crevettes, porc et légumes croquants',   1800, TRUE, 20),
  ('mi333333-3333-3333-3333-333333333333', 'ca333333-2222-2222-2222-333333333333', '33333333-3333-3333-3333-333333333333', 'Poulet au curry',    'Poulet mijoté au curry épicé à la sauce coco',         2200, TRUE, 25),
  ('mi333333-4444-4444-4444-333333333333', 'ca333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Sushi Mix Plate',   'Assortiment de makis et sashimi — 12 pièces',         3500, TRUE, 25),
  ('mi333333-5555-5555-5555-333333333333', 'ca333333-1111-1111-1111-333333333333', '33333333-3333-3333-3333-333333333333', 'Soupe Won Ton',     'Bouillon chaud aux raviolis crevettes et porc',        900,  TRUE, 15);

-- ============================================================
-- 5. Drivers
-- ============================================================

INSERT INTO drivers (id, vehicle_type, vehicle_plate, current_location, status, rating, wallet_balance, is_approved) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'moto',
    'LT 1234 YA',
    ST_SetSRID(ST_MakePoint(11.5040, 3.8490), 4326)::geography,
    'available',
    4.50,
    15000,
    TRUE
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'moto',
    'LT 5678 YA',
    ST_SetSRID(ST_MakePoint(11.5080, 3.8510), 4326)::geography,
    'offline',
    4.20,
    8500,
    TRUE
  );

-- ============================================================
-- 6. Re-enable triggers
-- ============================================================
ALTER TABLE auth.users ENABLE TRIGGER trigger_handle_new_user;