-- ============================================================
-- DjossFood Manual Seed (à exécuter dans Supabase SQL Editor)
-- ============================================================
-- Les IDs ci-dessous correspondent aux utilisateurs créés via l'API
-- ============================================================

-- 1. Profils (si manquants)
INSERT INTO profiles (id, full_name, phone, role) VALUES
  ('3606b6b7-445b-44eb-9984-13445c42e8c5', 'Jean Kamga',       '+237677123456', 'client'),
  ('6e2825f1-9082-4d72-b7a8-ff340ee08ee6', 'Marie Nkoulou',     '+237677234567', 'client'),
  ('2816b016-f7f2-4ab4-922c-6dd4b9dc3277', 'Paul Essomba',      '+237677345678', 'client'),
  ('ade6cfbc-e6fc-4350-9f07-2938a80fcb2b', 'Maman Ngono',       '+237688123456', 'restaurant_owner'),
  ('3e3dba8d-6561-4111-a044-cf4eb12cb955', 'Laurent Fotso',     '+237688234567', 'restaurant_owner'),
  ('6257af25-55c5-4ea6-a60d-7bf3d33433c0', 'Emmanuel Fopa',     '+237699111111', 'driver'),
  ('e146040d-6d20-4880-a0e9-cf4463eafa68', 'Alain Tchinda',     '+237699222222', 'driver')
ON CONFLICT (id) DO NOTHING;

-- 2. Restaurants
INSERT INTO restaurants (owner_id, name, description, city, address, location, phone, email, cuisine_types, is_active, is_approved, status, base_rating, admin_boost, min_order_amount) VALUES
  ('ade6cfbc-e6fc-4350-9f07-2938a80fcb2b', 'Chez Mama Ngono', 'Cuisine camerounaise traditionnelle — les meilleurs plats faits maison à Yaoundé', 'Yaoundé', 'Quartier Bastos, Rue 1.851, Yaoundé', ST_SetSRID(ST_MakePoint(11.5021, 3.8480), 4326)::geography, '+237688123456', 'contact@chezmangono.cm', ARRAY['Camerounais', 'Traditionnel', 'Soupe'], TRUE, TRUE, 'open', 4.20, 0.30, 1000),
  ('3e3dba8d-6561-4111-a044-cf4eb12cb955', 'Douala Pizza Express', 'Pizzas et fast-food — livraison rapide à Yaoundé', 'Yaoundé', 'Quartier Bonapriso, Avenue de la République, Yaoundé', ST_SetSRID(ST_MakePoint(11.5100, 3.8550), 4326)::geography, '+237688234567', 'info@doualapizza.cm', ARRAY['Pizza', 'Fast-food', 'Burgers'], TRUE, TRUE, 'open', 3.80, 0.50, 1500),
  ('3e3dba8d-6561-4111-a044-cf4eb12cb955', 'Wok Asiatique Yaoundé', 'Cuisine asiatique authentique au cœur de Yaoundé', 'Yaoundé', 'Quartier Nlongkak, Rue 2.401, Yaoundé', ST_SetSRID(ST_MakePoint(11.5050, 3.8520), 4326)::geography, '+237688234567', 'contact@wokasiatique.cm', ARRAY['Asiatique', 'Chinois', 'Japonais'], TRUE, TRUE, 'open', 3.50, 0.00, 2000);

-- 3. Menu Categories (on récupère les IDs auto-générés via une CTE)
WITH inserted_cats AS (
  INSERT INTO menu_categories (restaurant_id, name, display_order)
  SELECT r.id, c.name, c.display_order
  FROM (
    VALUES
      ('Chez Mama Ngono', 'Soupes Traditionnelles', 1),
      ('Chez Mama Ngono', 'Plats Principaux',       2),
      ('Chez Mama Ngono', 'Accompagnements',        3),
      ('Douala Pizza Express', 'Pizzas',    1),
      ('Douala Pizza Express', 'Burgers',   2),
      ('Douala Pizza Express', 'Boissons',  3),
      ('Wok Asiatique Yaoundé', 'Entrées',  1),
      ('Wok Asiatique Yaoundé', 'Plats',    2),
      ('Wok Asiatique Yaoundé', 'Sushis',   3)
  ) AS c(restaurant_name, name, display_order)
  JOIN restaurants r ON r.name = c.restaurant_name
  RETURNING id, restaurant_id, name
)
-- 4. Menu Items
INSERT INTO menu_items (category_id, restaurant_id, name, description, price, is_available, preparation_time_minutes)
SELECT c.id, c.restaurant_id, mi.name, mi.description, mi.price, mi.is_available, mi.preparation_time_minutes
FROM (
  VALUES
    ('Chez Mama Ngono', 'Soupes Traditionnelles', 'Ndolé',           'Feuilles de ndolé aux arachides grillées — plat populaire camerounais',  1200, TRUE, 20),
    ('Chez Mama Ngono', 'Plats Principaux',       'Poulet DG',       'Poulet rôti aux plantains mûrs et légumes — le classique camerounais', 2500, TRUE, 30),
    ('Chez Mama Ngono', 'Soupes Traditionnelles', 'Eru au waterleaf', 'Soupe d''eru au waterleaf et huile de palme',                             1000, TRUE, 20),
    ('Chez Mama Ngono', 'Plats Principaux',       'Kondré',          'Banane plantain bouillie à la sauce tomate épicée',                     800,  TRUE, 25),
    ('Chez Mama Ngono', 'Soupes Traditionnelles', 'Achu soup',       'Soupe jaune d''achu à l''huile de palme et viande de brousse',         700,  TRUE, 15),
    ('Douala Pizza Express', 'Pizzas',    'Pizza Margherita',    'Pizza classique sauce tomate, mozzarella et basilic frais', 2500, TRUE, 20),
    ('Douala Pizza Express', 'Pizzas',    'Pizza 4 Fromages',    'Pizza aux quatre fromages — mozzarella, gorgonzola, parmesan, gruyère', 3000, TRUE, 22),
    ('Douala Pizza Express', 'Burgers',   'Burger Classique',    'Burger boeuf grillé, salade, tomate, sauce maison',         1500, TRUE, 15),
    ('Douala Pizza Express', 'Burgers',   'Cheeseburger Double', 'Double steak, double fromage, oignons caramélisés',       2000, TRUE, 18),
    ('Douala Pizza Express', 'Boissons',  'Frites Maison',      'Frites croustillantes dorées — accompagnement parfait',    800,  TRUE, 10),
    ('Wok Asiatique Yaoundé', 'Entrées',  'Nems au poulet',    'Rouleaux de printemps frits au poulet et légumes',      1000, TRUE, 15),
    ('Wok Asiatique Yaoundé', 'Plats',    'Riz Cantonais',      'Riz sauté aux crevettes, porc et légumes croquants',   1800, TRUE, 20),
    ('Wok Asiatique Yaoundé', 'Plats',    'Poulet au curry',    'Poulet mijoté au curry épicé à la sauce coco',         2200, TRUE, 25),
    ('Wok Asiatique Yaoundé', 'Sushis',   'Sushi Mix Plate',   'Assortiment de makis et sashimi — 12 pièces',         3500, TRUE, 25),
    ('Wok Asiatique Yaoundé', 'Entrées',  'Soupe Won Ton',     'Bouillon chaud aux raviolis crevettes et porc',        900,  TRUE, 15)
) AS mi(restaurant_name, category_name, name, description, price, is_available, preparation_time_minutes)
JOIN restaurants r ON r.name = mi.restaurant_name
JOIN inserted_cats c ON c.restaurant_id = r.id AND c.name = mi.category_name;

-- 5. Drivers
INSERT INTO drivers (id, vehicle_type, vehicle_plate, current_location, status, rating, wallet_balance, is_approved) VALUES
  ('6257af25-55c5-4ea6-a60d-7bf3d33433c0', 'moto', 'LT 1234 YA', ST_SetSRID(ST_MakePoint(11.5040, 3.8490), 4326)::geography, 'available', 4.50, 15000, TRUE),
  ('e146040d-6d20-4880-a0e9-cf4463eafa68', 'moto', 'LT 5678 YA', ST_SetSRID(ST_MakePoint(11.5080, 3.8510), 4326)::geography, 'offline', 4.20, 8500, TRUE);

-- ============================================================
-- DONE !
-- ============================================================
