import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { getSupabaseAdmin } from '../config/supabase';
import type { DriverStatus } from '@djossfood/database';

const router = Router();

// All driver routes require authentication + driver role
router.use(authMiddleware);
router.use(roleGuard('driver'));

// GET /api/drivers/me - Get own driver profile
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: driver, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', req.userId!)
      .single();

    if (error || !driver) {
      return res.status(404).json({ error: 'Profil livreur non trouve' });
    }

    return res.json({ driver });
  } catch (err: any) {
    console.error('Get driver profile error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/drivers/me/status - Update driver status
router.put('/me/status', async (req: AuthRequest, res: Response) => {
  const { status } = req.body as { status: DriverStatus };

  if (!status || !['available', 'offline', 'busy'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide. Valeurs acceptees: available, offline, busy' });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: driver, error } = await supabase
      .from('drivers')
      .update({ status })
      .eq('id', req.userId!)
      .select()
      .single();

    if (error || !driver) {
      return res.status(404).json({ error: 'Profil livreur non trouve' });
    }

    return res.json({ driver });
  } catch (err: any) {
    console.error('Update driver status error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/drivers/me/location - Update driver GPS location
router.put('/me/location', async (req: AuthRequest, res: Response) => {
  const { lat, lng } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Latitude et longitude requises (nombres)' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Update location as PostGIS GeoJSON Point
    const { data: driver, error } = await supabase
      .from('drivers')
      .update({
        current_location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        current_location_updated_at: new Date().toISOString(),
      })
      .eq('id', req.userId!)
      .select()
      .single();

    if (error || !driver) {
      return res.status(404).json({ error: 'Profil livreur non trouve' });
    }

    return res.json({ driver });
  } catch (err: any) {
    console.error('Update driver location error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/drivers/me/earnings - Get driver earnings summary
router.get('/me/earnings', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    // Get driver profile with wallet balance
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, wallet_balance, total_deliveries')
      .eq('id', req.userId!)
      .single();

    if (driverError || !driver) {
      return res.status(404).json({ error: 'Profil livreur non trouve' });
    }

    // Get today's completed deliveries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id, delivery_fee, total_amount, created_at')
      .eq('driver_id', req.userId!)
      .eq('status', 'completed')
      .gte('completed_at', todayIso);

    const todayEarnings = (todayOrders || []).reduce((sum: number, order: any) => {
      // Driver earns delivery_fee minus platform commission
      return sum + Math.round((order.delivery_fee || 0) * 0.85);
    }, 0);

    const todayDeliveries = (todayOrders || []).length;

    // Get recent delivery history (last 30)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, delivery_fee, completed_at, restaurants(name)')
      .eq('driver_id', req.userId!)
      .in('status', ['completed', 'delivered'])
      .order('completed_at', { ascending: false })
      .limit(30);

    const deliveries = (recentOrders || []).map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      restaurant_name: order.restaurants?.name || 'Restaurant',
      amount: Math.round((order.delivery_fee || 0) * 0.85),
      date: order.completed_at,
    }));

    return res.json({
      wallet_balance: driver.wallet_balance,
      today_earnings: todayEarnings,
      today_deliveries: todayDeliveries,
      total_deliveries: driver.total_deliveries,
      deliveries,
    });
  } catch (err: any) {
    console.error('Get driver earnings error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const driversRouter = router;