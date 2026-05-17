import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { getSupabaseAdmin } from '../config/supabase';

const router = Router();

// All restaurant-owner routes require authentication + restaurant_owner role
router.use(authMiddleware);
router.use(roleGuard('restaurant_owner'));

// Helper: find the restaurant owned by the current user
async function findOwnerRestaurant(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_active', true)
    .single();
  return { restaurant, error };
}

// ---------------------------------------------------------------------------
// GET /restaurant — Get current user's restaurant
// ---------------------------------------------------------------------------
router.get('/restaurant', async (req: AuthRequest, res: Response) => {
  try {
    const { restaurant, error } = await findOwnerRestaurant(req.userId!);

    if (error || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    return res.json({ restaurant });
  } catch (err: any) {
    console.error('Get owner restaurant error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// PUT /restaurant — Update restaurant settings
// ---------------------------------------------------------------------------
router.put('/restaurant', async (req: AuthRequest, res: Response) => {
  const allowedFields = [
    'name',
    'description',
    'phone',
    'address',
    'opening_hours',
    'min_order_amount',
    'delivery_fee',
    'status',
    'logo_url',
    'cover_url',
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Aucun champ a mettre a jour' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Find restaurant owned by user (does not require is_active for updates)
    const { data: restaurant, error: findError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.userId!)
      .single();

    if (findError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', restaurant.id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('Update restaurant error:', updateError?.message);
      return res.status(500).json({ error: 'Erreur lors de la mise a jour du restaurant' });
    }

    return res.json({ restaurant: updated });
  } catch (err: any) {
    console.error('Update restaurant error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET /orders — Get orders for current restaurant
// ---------------------------------------------------------------------------
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const { restaurant, error: findError } = await findOwnerRestaurant(req.userId!);

    if (findError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const supabase = getSupabaseAdmin();
    const statusFilter = req.query.status as string | undefined;

    // By default exclude terminal statuses
    const terminalStatuses = ['completed', 'cancelled', 'rejected'];

    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    } else {
      query = query.not('status', 'in', `(${terminalStatuses.map((s) => `"${s}"`).join(',')})`);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Get owner orders error:', error.message);
      return res.status(500).json({ error: 'Erreur lors du chargement des commandes' });
    }

    return res.json({ orders: orders || [] });
  } catch (err: any) {
    console.error('Get owner orders error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST /menu-categories — Create menu category
// ---------------------------------------------------------------------------
router.post('/menu-categories', async (req: AuthRequest, res: Response) => {
  const { name, description, sort_order } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Le nom de la categorie est requis' });
  }

  try {
    const { restaurant, error: findError } = await findOwnerRestaurant(req.userId!);

    if (findError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const supabase = getSupabaseAdmin();

    const insertData: Record<string, unknown> = {
      restaurant_id: restaurant.id,
      name,
      is_active: true,
    };

    if (description !== undefined) insertData.description = description;
    if (sort_order !== undefined) insertData.sort_order = sort_order;

    const { data: category, error: insertError } = await supabase
      .from('menu_categories')
      .insert(insertData)
      .select()
      .single();

    if (insertError || !category) {
      console.error('Create menu category error:', insertError?.message);
      return res.status(500).json({ error: 'Erreur lors de la creation de la categorie' });
    }

    return res.status(201).json({ category });
  } catch (err: any) {
    console.error('Create menu category error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// PUT /menu-categories/:id — Update menu category
// ---------------------------------------------------------------------------
router.put('/menu-categories/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const allowedFields = ['name', 'description', 'sort_order', 'is_active'] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Aucun champ a mettre a jour' });
  }

  try {
    const { restaurant, error: findError } = await findOwnerRestaurant(req.userId!);

    if (findError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const supabase = getSupabaseAdmin();

    // Verify category belongs to user's restaurant
    const { data: existing, error: findCatError } = await supabase
      .from('menu_categories')
      .select('id, restaurant_id')
      .eq('id', id)
      .single();

    if (findCatError || !existing) {
      return res.status(404).json({ error: 'Categorie non trouvee' });
    }

    if ((existing as any).restaurant_id !== restaurant.id) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const { data: category, error: updateError } = await supabase
      .from('menu_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !category) {
      console.error('Update menu category error:', updateError?.message);
      return res.status(500).json({ error: 'Erreur lors de la mise a jour de la categorie' });
    }

    return res.json({ category });
  } catch (err: any) {
    console.error('Update menu category error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /menu-categories/:id — Delete menu category
// ---------------------------------------------------------------------------
router.delete('/menu-categories/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { restaurant, error: findError } = await findOwnerRestaurant(req.userId!);

    if (findError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const supabase = getSupabaseAdmin();

    // Verify category belongs to user's restaurant
    const { data: existing, error: findCatError } = await supabase
      .from('menu_categories')
      .select('id, restaurant_id')
      .eq('id', id)
      .single();

    if (findCatError || !existing) {
      return res.status(404).json({ error: 'Categorie non trouvee' });
    }

    if ((existing as any).restaurant_id !== restaurant.id) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const { error: deleteError } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete menu category error:', deleteError.message);
      return res.status(500).json({ error: 'Erreur lors de la suppression de la categorie' });
    }

    return res.json({ message: 'Categorie supprimee avec succes' });
  } catch (err: any) {
    console.error('Delete menu category error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST /menu-items — Create menu item
// ---------------------------------------------------------------------------
router.post('/menu-items', async (req: AuthRequest, res: Response) => {
  const { name, price, description, category_id, image_url, tags, is_available } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Le nom du plat est requis' });
  }

  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Le prix est requis et doit etre un nombre positif' });
  }

  try {
    const { restaurant, error: findError } = await findOwnerRestaurant(req.userId!);

    if (findError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const supabase = getSupabaseAdmin();

    const insertData: Record<string, unknown> = {
      restaurant_id: restaurant.id,
      name,
      price,
      is_active: true,
      is_available: is_available !== undefined ? is_available : true,
    };

    if (description !== undefined) insertData.description = description;
    if (category_id !== undefined) insertData.category_id = category_id;
    if (image_url !== undefined) insertData.image_url = image_url;
    if (tags !== undefined) insertData.tags = tags;

    const { data: item, error: insertError } = await supabase
      .from('menu_items')
      .insert(insertData)
      .select()
      .single();

    if (insertError || !item) {
      console.error('Create menu item error:', insertError?.message);
      return res.status(500).json({ error: 'Erreur lors de la creation du plat' });
    }

    return res.status(201).json({ item });
  } catch (err: any) {
    console.error('Create menu item error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// PUT /menu-items/:id — Update menu item
// ---------------------------------------------------------------------------
router.put('/menu-items/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const allowedFields = ['name', 'description', 'price', 'category_id', 'image_url', 'tags', 'is_available'] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Aucun champ a mettre a jour' });
  }

  try {
    const { restaurant, error: findError } = await findOwnerRestaurant(req.userId!);

    if (findError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const supabase = getSupabaseAdmin();

    // Verify item belongs to user's restaurant
    const { data: existing, error: findItemError } = await supabase
      .from('menu_items')
      .select('id, restaurant_id')
      .eq('id', id)
      .single();

    if (findItemError || !existing) {
      return res.status(404).json({ error: 'Plat non trouve' });
    }

    if ((existing as any).restaurant_id !== restaurant.id) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const { data: item, error: updateError } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !item) {
      console.error('Update menu item error:', updateError?.message);
      return res.status(500).json({ error: 'Erreur lors de la mise a jour du plat' });
    }

    return res.json({ item });
  } catch (err: any) {
    console.error('Update menu item error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /menu-items/:id — Delete menu item
// ---------------------------------------------------------------------------
router.delete('/menu-items/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { restaurant, error: findError } = await findOwnerRestaurant(req.userId!);

    if (findError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const supabase = getSupabaseAdmin();

    // Verify item belongs to user's restaurant
    const { data: existing, error: findItemError } = await supabase
      .from('menu_items')
      .select('id, restaurant_id')
      .eq('id', id)
      .single();

    if (findItemError || !existing) {
      return res.status(404).json({ error: 'Plat non trouve' });
    }

    if ((existing as any).restaurant_id !== restaurant.id) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete menu item error:', deleteError.message);
      return res.status(500).json({ error: 'Erreur lors de la suppression du plat' });
    }

    return res.json({ message: 'Plat supprime avec succes' });
  } catch (err: any) {
    console.error('Delete menu item error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const restaurantOwnerRouter = router;