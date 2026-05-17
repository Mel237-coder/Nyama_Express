import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { getSupabaseAdmin } from '../config/supabase';

const router = Router();

// All driver-owner routes require authentication + driver role
router.use(authMiddleware);
router.use(roleGuard('driver'));

const VALID_VEHICLE_TYPES = ['motorcycle', 'bicycle', 'car'];

// ---------------------------------------------------------------------------
// POST /register — Create driver profile with vehicle info
// ---------------------------------------------------------------------------
router.post('/register', async (req: AuthRequest, res: Response) => {
  const { vehicle_type, vehicle_plate, license_number } = req.body;

  // Validate vehicle_type
  if (!vehicle_type || !VALID_VEHICLE_TYPES.includes(vehicle_type)) {
    return res.status(400).json({ error: 'vehicle_type invalide. Valeurs acceptees: motorcycle, bicycle, car' });
  }

  // vehicle_plate is required for non-bicycle types
  if (vehicle_type !== 'bicycle' && !vehicle_plate) {
    return res.status(400).json({ error: 'vehicle_plate est requis pour ce type de vehicule' });
  }

  // license_number is always required
  if (!license_number) {
    return res.status(400).json({ error: 'license_number est requis' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Check if driver profile already exists
    const { data: existing, error: checkError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', req.userId!)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Profil livreur deja existant' });
    }

    // Insert driver profile (license_number stored in documents JSONB since it's not a SQL column)
    const insertData: Record<string, unknown> = {
      id: req.userId!,
      vehicle_type,
      is_approved: false,
      documents: { license_number },
    };

    if (vehicle_plate) {
      insertData.vehicle_plate = vehicle_plate;
    }

    const { data: driver, error: insertError } = await supabase
      .from('drivers')
      .insert(insertData)
      .select()
      .single();

    if (insertError || !driver) {
      console.error('Create driver profile error:', insertError?.message);
      return res.status(500).json({ error: 'Erreur lors de la creation du profil livreur' });
    }

    return res.status(201).json({ driver });
  } catch (err: any) {
    console.error('Create driver profile error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// POST /documents — Upload driver documents
// ---------------------------------------------------------------------------
router.post('/documents', async (req: AuthRequest, res: Response) => {
  const { license_photo_url, id_photo_url, vehicle_photo_url } = req.body;

  // license_photo_url and id_photo_url are required
  if (!license_photo_url) {
    return res.status(400).json({ error: 'license_photo_url est requis' });
  }
  if (!id_photo_url) {
    return res.status(400).json({ error: 'id_photo_url est requis' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Get current driver profile
    const { data: driver, error: findError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', req.userId!)
      .single();

    if (findError || !driver) {
      return res.status(404).json({ error: 'Profil livreur non trouve' });
    }

    // Merge document URLs into existing documents JSONB
    const existingDocuments = (driver.documents || {}) as Record<string, unknown>;
    const updatedDocuments: Record<string, unknown> = {
      ...existingDocuments,
      license_photo_url,
      id_photo_url,
    };

    if (vehicle_photo_url) {
      updatedDocuments.vehicle_photo_url = vehicle_photo_url;
    }

    const { data: updated, error: updateError } = await supabase
      .from('drivers')
      .update({ documents: updatedDocuments })
      .eq('id', req.userId!)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('Update driver documents error:', updateError?.message);
      return res.status(500).json({ error: 'Erreur lors de la mise a jour des documents' });
    }

    return res.json({ driver: updated });
  } catch (err: any) {
    console.error('Update driver documents error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ---------------------------------------------------------------------------
// GET /earnings — Get earnings summary + recent deliveries
// ---------------------------------------------------------------------------
router.get('/earnings', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    // Get driver profile for wallet_balance and total_deliveries
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('wallet_balance, total_deliveries, documents')
      .eq('id', req.userId!)
      .single();

    if (driverError || !driver) {
      return res.status(404).json({ error: 'Profil livreur non trouve' });
    }

    // Query recent delivered/completed orders for this driver
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status, delivery_fee, created_at, restaurant_id')
      .eq('driver_id', req.userId!)
      .in('status', ['delivered', 'completed'])
      .order('created_at', { ascending: false })
      .limit(30);

    if (ordersError) {
      console.error('Get driver earnings orders error:', ordersError.message);
      return res.status(500).json({ error: 'Erreur lors du chargement des gains' });
    }

    // Calculate today's earnings (driver gets 85% of delivery_fee)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = (orders || []).filter((o: any) => {
      const orderDate = new Date(o.created_at);
      return orderDate >= today;
    });

    const todayEarnings = todayOrders.reduce((sum: number, o: any) => {
      return sum + Math.round(o.delivery_fee * 0.85);
    }, 0);

    // Get restaurant names for the orders
    const restaurantIds = [...new Set((orders || []).map((o: any) => o.restaurant_id))];

    let restaurantNames: Record<string, string> = {};
    if (restaurantIds.length > 0) {
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name')
        .in('id', restaurantIds);

      if (restaurants) {
        restaurantNames = restaurants.reduce((map: Record<string, string>, r: any) => {
          map[r.id] = r.name;
          return map;
        }, {});
      }
    }

    const deliveries = (orders || []).map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      delivery_fee: o.delivery_fee,
      driver_earnings: Math.round(o.delivery_fee * 0.85),
      created_at: o.created_at,
      restaurant_name: restaurantNames[o.restaurant_id] || 'Restaurant inconnu',
    }));

    return res.json({
      wallet_balance: driver.wallet_balance ?? 0,
      total_deliveries: driver.total_deliveries ?? orders?.length ?? 0,
      today_earnings: todayEarnings,
      today_deliveries: todayOrders.length,
      deliveries,
    });
  } catch (err: any) {
    console.error('Get driver earnings error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const driverOwnerRouter = router;