import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase';

const router = Router();

// GET /api/restaurants?page=&limit=
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurants, error, count } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('is_featured', { ascending: false })
      .order('total_rating', { ascending: false });

    if (error) {
      console.error('List restaurants error:', error.message);
      return res.status(500).json({ error: 'Erreur lors du chargement des restaurants' });
    }

    return res.json({
      restaurants: restaurants || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err: any) {
    console.error('List restaurants error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/restaurants/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    return res.json({ restaurant });
  } catch (err: any) {
    console.error('Get restaurant error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/restaurants/:id/menu
router.get('/:id/menu', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseAdmin();

    // Verify restaurant exists and is active
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (restError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    // Fetch menu categories
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (catError) {
      console.error('Fetch menu categories error:', catError.message);
      return res.status(500).json({ error: 'Erreur lors du chargement du menu' });
    }

    // Fetch menu items for this restaurant
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (itemsError) {
      console.error('Fetch menu items error:', itemsError.message);
      return res.status(500).json({ error: 'Erreur lors du chargement du menu' });
    }

    // Group items by category
    const itemsByCategory = new Map<string, any[]>();
    const uncategorized: any[] = [];

    for (const item of items || []) {
      if (item.category_id) {
        const existing = itemsByCategory.get(item.category_id) || [];
        existing.push(item);
        itemsByCategory.set(item.category_id, existing);
      } else {
        uncategorized.push(item);
      }
    }

    const menu = (categories || []).map((cat: any) => ({
      ...cat,
      items: itemsByCategory.get(cat.id) || [],
    }));

    // Add uncategorized items under a virtual "Autres" category if any exist
    if (uncategorized.length > 0) {
      menu.push({
        id: null,
        name: 'Autres',
        description: null,
        sort_order: 999,
        items: uncategorized,
      });
    }

    return res.json({ menu });
  } catch (err: any) {
    console.error('Get menu error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const restaurantsRouter = router;