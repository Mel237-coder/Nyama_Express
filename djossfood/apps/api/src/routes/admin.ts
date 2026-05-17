import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { getSupabaseAdmin } from '../config/supabase';

const router = Router();

// All admin routes require authentication + admin role
router.use(authMiddleware);
router.use(roleGuard('admin'));

// GET /api/admin/restaurants - List all restaurants (including inactive)
router.get('/restaurants', async (_req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin list restaurants error:', error.message);
      return res.status(500).json({ error: 'Erreur lors du chargement des restaurants' });
    }

    return res.json({ restaurants: restaurants || [] });
  } catch (err: any) {
    console.error('Admin list restaurants error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/admin/restaurants/:id/boost - Set admin_boost for a restaurant
router.put('/restaurants/:id/boost', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { boost, reason } = req.body;

  if (typeof boost !== 'number' || boost < 0) {
    return res.status(400).json({ error: 'La valeur du boost doit etre un nombre positif' });
  }

  if (!reason || typeof reason !== 'string') {
    return res.status(400).json({ error: 'La raison du boost est requise' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Update the restaurant's admin_boost
    const { data: restaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ admin_boost: boost })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    // Log the admin action
    await supabase.from('admin_actions').insert({
      admin_id: req.userId!,
      action_type: 'boost_restaurant',
      target_type: 'restaurant',
      target_id: id,
      previous_value: { admin_boost: (restaurant as any).admin_boost },
      new_value: { admin_boost: boost },
      reason,
    });

    return res.json({ restaurant });
  } catch (err: any) {
    console.error('Admin boost error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/admin/drivers - List all drivers (including unapproved)
router.get('/drivers', async (_req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*, profiles!drivers_id_fkey(full_name, phone, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin list drivers error:', error.message);
      return res.status(500).json({ error: 'Erreur lors du chargement des livreurs' });
    }

    return res.json({ drivers: drivers || [] });
  } catch (err: any) {
    console.error('Admin list drivers error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/admin/drivers/:id/approve - Approve a driver
router.put('/drivers/:id/approve', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseAdmin();

    const { data: driver, error: updateError } = await supabase
      .from('drivers')
      .update({ is_approved: true })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !driver) {
      return res.status(404).json({ error: 'Livreur non trouve' });
    }

    // Log the admin action
    await supabase.from('admin_actions').insert({
      admin_id: req.userId!,
      action_type: 'approve_driver',
      target_type: 'driver',
      target_id: id,
      previous_value: { is_approved: false },
      new_value: { is_approved: true },
      reason: 'Admin approval',
    });

    return res.json({ driver });
  } catch (err: any) {
    console.error('Admin approve driver error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/admin/orders - List all orders
router.get('/orders', async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const status = req.query.status as string | undefined;
  const offset = (page - 1) * limit;

  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Admin list orders error:', error.message);
      return res.status(500).json({ error: 'Erreur lors du chargement des commandes' });
    }

    return res.json({
      orders: orders || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err: any) {
    console.error('Admin list orders error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/admin/kpis - Dashboard KPIs
router.get('/kpis', async (_req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    // Total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Total revenue (sum of total_amount from completed orders)
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'completed');

    const totalRevenue = (revenueData || []).reduce(
      (sum: number, o: any) => sum + (o.total_amount || 0),
      0,
    );

    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Total restaurants
    const { count: totalRestaurants } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true });

    // Total drivers
    const { count: totalDrivers } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true });

    // Active orders (non-terminal statuses)
    const { count: activeOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'delivering']);

    // Orders by status
    const { data: ordersByStatus } = await supabase
      .from('orders')
      .select('status');

    const statusCounts: Record<string, number> = {};
    for (const row of ordersByStatus || []) {
      const s = (row as any).status;
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }

    return res.json({
      totalOrders: totalOrders || 0,
      totalRevenue,
      totalUsers: totalUsers || 0,
      totalRestaurants: totalRestaurants || 0,
      totalDrivers: totalDrivers || 0,
      activeOrders: activeOrders || 0,
      ordersByStatus: statusCounts,
    });
  } catch (err: any) {
    console.error('Admin KPIs error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const adminRouter = router;