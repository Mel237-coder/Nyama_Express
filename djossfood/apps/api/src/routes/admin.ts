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

    // Fetch current boost value first
    const { data: current, error: fetchError } = await supabase
      .from('restaurants')
      .select('admin_boost')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const previousBoost = current.admin_boost;

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

    // Log the admin action with correct previous_value
    await supabase.from('admin_actions').insert({
      admin_id: req.userId!,
      action_type: 'boost_restaurant',
      target_type: 'restaurant',
      target_id: id,
      previous_value: { admin_boost: previousBoost },
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

    // Daily revenue for last 14 days
    const { data: dailyOrders } = await supabase
      .from('orders')
      .select('total_amount, completed_at')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    const dailyMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    for (const order of dailyOrders || []) {
      const day = (order as any).completed_at?.split('T')[0];
      if (day && day in dailyMap) {
        dailyMap[day] += (order as any).total_amount || 0;
      }
    }
    const dailyRevenue = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

    return res.json({
      totalOrders: totalOrders || 0,
      totalRevenue,
      totalUsers: totalUsers || 0,
      totalRestaurants: totalRestaurants || 0,
      totalDrivers: totalDrivers || 0,
      activeOrders: activeOrders || 0,
      ordersByStatus: statusCounts,
      dailyRevenue,
    });
  } catch (err: any) {
    console.error('Admin KPIs error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/admin/restaurants/:id/approve - Toggle restaurant approval
router.put('/restaurants/:id/approve', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { is_approved } = req.body as { is_approved: boolean };

  if (typeof is_approved !== 'boolean') {
    return res.status(400).json({ error: 'is_approved doit etre un booleen' });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ is_approved })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    await supabase.from('admin_actions').insert({
      admin_id: req.userId!,
      action_type: is_approved ? 'approve_restaurant' : 'disapprove_restaurant',
      target_type: 'restaurant',
      target_id: id,
      previous_value: { is_approved: !is_approved },
      new_value: { is_approved },
      reason: is_approved ? 'Admin approval' : 'Admin disapproval',
    });

    return res.json({ restaurant });
  } catch (err: any) {
    console.error('Admin approve restaurant error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/admin/drivers/:id - Get single driver with profile details
router.get('/drivers/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseAdmin();

    const { data: driver, error } = await supabase
      .from('drivers')
      .select('*, profiles!drivers_id_fkey(full_name, phone, avatar_url)')
      .eq('id', id)
      .single();

    if (error || !driver) {
      return res.status(404).json({ error: 'Livreur non trouve' });
    }

    return res.json({ driver });
  } catch (err: any) {
    console.error('Admin get driver error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/admin/notifications - List all notifications (paginated)
router.get('/notifications', async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
  const offset = (page - 1) * limit;

  try {
    const supabase = getSupabaseAdmin();

    const { data: notifications, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Admin list notifications error:', error.message);
      return res.status(500).json({ error: 'Erreur lors du chargement des notifications' });
    }

    return res.json({
      notifications: notifications || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err: any) {
    console.error('Admin list notifications error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const adminRouter = router;