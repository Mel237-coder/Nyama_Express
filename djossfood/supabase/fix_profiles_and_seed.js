// ============================================================
// Fix: insert missing profiles then seed data
// Usage: node fix_profiles_and_seed.js
// ============================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uuwarlyppcqlrfrotnfi.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1d2FybHlwcGNxbHJmcm90bmZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI2NDkxNywiZXhwIjoyMDk0ODQwOTE3fQ.NJwlLKxRN3os_K-iychsMGQ_8oJeohJ9A4-DKGCssH0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: (url, opts) => fetch(url, { ...opts, signal: AbortSignal.timeout(30000) }) },
});

async function getUsers() {
  const emails = [
    'client1@djossfood.com',
    'client2@djossfood.com',
    'client3@djossfood.com',
    'owner1@djossfood.com',
    'owner2@djossfood.com',
    'driver1@djossfood.com',
    'driver2@djossfood.com',
  ];
  const users = [];
  for (const email of emails) {
    const { data, error } = await supabase.auth.admin.listUsers({
      filters: { email: email },
    });
    if (error || !data?.users?.length) {
      console.error('User not found:', email, error?.message);
      continue;
    }
    users.push({ email, id: data.users[0].id, meta: data.users[0].user_metadata });
  }
  return users;
}

async function ensureProfiles(users) {
  const profiles = users.map(u => ({
    id: u.id,
    full_name: u.meta?.full_name || u.email.split('@')[0],
    phone: u.meta?.phone || '',
    role: u.meta?.role || 'client',
  }));

  const { error } = await supabase.from('profiles').insert(profiles);
  if (error) {
    console.error('Profiles insert error:', error.message);
    return false;
  }
  console.log('Inserted', profiles.length, 'profiles');
  return true;
}

async function seedData(users) {
  const ownerIds = users.filter(u => u.email.includes('owner')).map(u => u.id);
  const driverIds = users.filter(u => u.email.includes('driver')).map(u => u.id);

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
  const users = await getUsers();
  console.log('Found', users.length, 'existing users');
  if (users.length < 7) {
    console.error('Not all users found, aborting.');
    process.exit(1);
  }
  const ok = await ensureProfiles(users);
  if (!ok) {
    console.error('Failed to insert profiles, aborting.');
    process.exit(1);
  }
  await seedData(users);
})();
