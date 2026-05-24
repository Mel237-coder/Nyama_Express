// ============================================================
// DjossFood Seed via Supabase API
// Run after schema_only.sql has been applied
// Usage: node seed_via_api.js
// ============================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uuwarlyppcqlrfrotnfi.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1d2FybHlwcGNxbHJmcm90bmZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI2NDkxNywiZXhwIjoyMDk0ODQwOTE3fQ.NJwlLKxRN3os_K-iychsMGQ_8oJeohJ9A4-DKGCssH0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const usersToCreate = [
  { email: 'client1@djossfood.com', password: 'Test123!', full_name: 'Jean Kamga', phone: '+237677123456', role: 'client' },
  { email: 'client2@djossfood.com', password: 'Test123!', full_name: 'Marie Nkoulou', phone: '+237677234567', role: 'client' },
  { email: 'client3@djossfood.com', password: 'Test123!', full_name: 'Paul Essomba', phone: '+237677345678', role: 'client' },
  { email: 'owner1@djossfood.com', password: 'Test123!', full_name: 'Maman Ngono', phone: '+237688123456', role: 'restaurant_owner' },
  { email: 'owner2@djossfood.com', password: 'Test123!', full_name: 'Laurent Fotso', phone: '+237688234567', role: 'restaurant_owner' },
  { email: 'driver1@djossfood.com', password: 'Test123!', full_name: 'Emmanuel Fopa', phone: '+237699111111', role: 'driver' },
  { email: 'driver2@djossfood.com', password: 'Test123!', full_name: 'Alain Tchinda', phone: '+237699222222', role: 'driver' },
];

async function createUsers() {
  const created = [];
  for (const u of usersToCreate) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
      },
    });
    if (error) {
      console.error('Failed to create', u.email, error.message);
      continue;
    }
    console.log('Created user:', u.email, '->', data.user.id);
    created.push({ ...u, id: data.user.id });
  }
  return created;
}

async function seedData(users) {
  const clientIds = users.filter(u => u.role === 'client').map(u => u.id);
  const ownerIds  = users.filter(u => u.role === 'restaurant_owner').map(u => u.id);
  const driverIds = users.filter(u => u.role === 'driver').map(u => u.id);

  // Restaurants
  const { data: restaurants, error: rErr } = await supabase.from('restaurants').insert([
    { owner_id: ownerIds[0], name: 'Chez Mama Ngono', description: 'Cuisine camerounaise traditionnelle', city: 'Yaoundé', address: 'Quartier Bastos, Rue 1.851, Yaoundé', location: 'POINT(11.5021 3.8480)', phone: '+237688123456', email: 'contact@chezmangono.cm', cuisine_types: ['Camerounais', 'Traditionnel', 'Soupe'], is_active: true, is_approved: true, status: 'open', base_rating: 4.20, admin_boost: 0.30, min_order_amount: 1000 },
    { owner_id: ownerIds[1], name: 'Douala Pizza Express', description: 'Pizzas et fast-food', city: 'Yaoundé', address: 'Quartier Bonapriso, Avenue de la République, Yaoundé', location: 'POINT(11.5100 3.8550)', phone: '+237688234567', email: 'info@doualapizza.cm', cuisine_types: ['Pizza', 'Fast-food', 'Burgers'], is_active: true, is_approved: true, status: 'open', base_rating: 3.80, admin_boost: 0.50, min_order_amount: 1500 },
    { owner_id: ownerIds[1], name: 'Wok Asiatique Yaoundé', description: 'Cuisine asiatique authentique', city: 'Yaoundé', address: 'Quartier Nlongkak, Rue 2.401, Yaoundé', location: 'POINT(11.5050 3.8520)', phone: '+237688234567', email: 'contact@wokasiatique.cm', cuisine_types: ['Asiatique', 'Chinois', 'Japonais'], is_active: true, is_approved: true, status: 'open', base_rating: 3.50, admin_boost: 0.00, min_order_amount: 2000 },
  ]).select();

  if (rErr) { console.error('Restaurants error:', rErr.message); return; }
  console.log('Inserted', restaurants.length, 'restaurants');

  const r1 = restaurants[0].id;
  const r2 = restaurants[1].id;
  const r3 = restaurants[2].id;

  // Menu Categories
  const { data: cats } = await supabase.from('menu_categories').insert([
    { restaurant_id: r1, name: 'Soupes Traditionnelles', display_order: 1 },
    { restaurant_id: r1, name: 'Plats Principaux',       display_order: 2 },
    { restaurant_id: r1, name: 'Accompagnements',        display_order: 3 },
    { restaurant_id: r2, name: 'Pizzas',    display_order: 1 },
    { restaurant_id: r2, name: 'Burgers',   display_order: 2 },
    { restaurant_id: r2, name: 'Boissons',  display_order: 3 },
    { restaurant_id: r3, name: 'Entrées',  display_order: 1 },
    { restaurant_id: r3, name: 'Plats',    display_order: 2 },
    { restaurant_id: r3, name: 'Sushis',   display_order: 3 },
  ]).select();

  const c1 = cats.slice(0, 3);
  const c2 = cats.slice(3, 6);
  const c3 = cats.slice(6, 9);

  // Menu Items
  await supabase.from('menu_items').insert([
    { category_id: c1[0].id, restaurant_id: r1, name: 'Ndolé',           description: 'Feuilles de ndolé aux arachides grillées', price: 1200, is_available: true, preparation_time_minutes: 20 },
    { category_id: c1[1].id, restaurant_id: r1, name: 'Poulet DG',       description: 'Poulet rôti aux plantains mûrs et légumes', price: 2500, is_available: true, preparation_time_minutes: 30 },
    { category_id: c1[0].id, restaurant_id: r1, name: 'Eru au waterleaf', description: 'Soupe d\'eru au waterleaf et huile de palme', price: 1000, is_available: true, preparation_time_minutes: 20 },
    { category_id: c1[1].id, restaurant_id: r1, name: 'Kondré',          description: 'Banane plantain bouillie à la sauce tomate épicée', price: 800, is_available: true, preparation_time_minutes: 25 },
    { category_id: c1[0].id, restaurant_id: r1, name: 'Achu soup',       description: 'Soupe jaune d\'achu à l\'huile de palme', price: 700, is_available: true, preparation_time_minutes: 15 },
    { category_id: c2[0].id, restaurant_id: r2, name: 'Pizza Margherita',    description: 'Pizza classique sauce tomate, mozzarella', price: 2500, is_available: true, preparation_time_minutes: 20 },
    { category_id: c2[0].id, restaurant_id: r2, name: 'Pizza 4 Fromages',    description: 'Pizza aux quatre fromages', price: 3000, is_available: true, preparation_time_minutes: 22 },
    { category_id: c2[1].id, restaurant_id: r2, name: 'Burger Classique',    description: 'Burger boeuf grillé, salade, tomate', price: 1500, is_available: true, preparation_time_minutes: 15 },
    { category_id: c2[1].id, restaurant_id: r2, name: 'Cheeseburger Double', description: 'Double steak, double fromage', price: 2000, is_available: true, preparation_time_minutes: 18 },
    { category_id: c2[2].id, restaurant_id: r2, name: 'Frites Maison',      description: 'Frites croustillantes dorées', price: 800, is_available: true, preparation_time_minutes: 10 },
    { category_id: c3[0].id, restaurant_id: r3, name: 'Nems au poulet',    description: 'Rouleaux de printemps frits au poulet', price: 1000, is_available: true, preparation_time_minutes: 15 },
    { category_id: c3[1].id, restaurant_id: r3, name: 'Riz Cantonais',      description: 'Riz sauté aux crevettes, porc et légumes', price: 1800, is_available: true, preparation_time_minutes: 20 },
    { category_id: c3[1].id, restaurant_id: r3, name: 'Poulet au curry',    description: 'Poulet mijoté au curry épicé à la sauce coco', price: 2200, is_available: true, preparation_time_minutes: 25 },
    { category_id: c3[2].id, restaurant_id: r3, name: 'Sushi Mix Plate',   description: 'Assortiment de makis et sashimi — 12 pièces', price: 3500, is_available: true, preparation_time_minutes: 25 },
    { category_id: c3[0].id, restaurant_id: r3, name: 'Soupe Won Ton',     description: 'Bouillon chaud aux raviolis crevettes et porc', price: 900, is_available: true, preparation_time_minutes: 15 },
  ]);
  console.log('Inserted 15 menu items');

  // Drivers
  await supabase.from('drivers').insert([
    { id: driverIds[0], vehicle_type: 'moto', vehicle_plate: 'LT 1234 YA', current_location: 'POINT(11.5040 3.8490)', status: 'available', rating: 4.50, wallet_balance: 15000, is_approved: true },
    { id: driverIds[1], vehicle_type: 'moto', vehicle_plate: 'LT 5678 YA', current_location: 'POINT(11.5080 3.8510)', status: 'offline', rating: 4.20, wallet_balance: 8500, is_approved: true },
  ]);
  console.log('Inserted 2 drivers');

  console.log('\nSeed complete!');
}

(async () => {
  const users = await createUsers();
  if (users.length === usersToCreate.length) {
    await seedData(users);
  } else {
    console.error('Not all users were created, aborting seed.');
    process.exit(1);
  }
})();
