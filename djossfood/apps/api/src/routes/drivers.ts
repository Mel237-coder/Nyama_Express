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

export const driversRouter = router;