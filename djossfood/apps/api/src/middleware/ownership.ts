import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { getSupabaseAdmin } from '../config/supabase';

export async function requireOrderOwnerOrAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;
  const userId = req.userId!;
  const userRole = req.userRole!;

  if (userRole === 'admin') {
    return next();
  }

  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from('orders')
    .select('client_id, restaurant_id, driver_id')
    .eq('id', id)
    .single();

  if (error || !order) {
    return res.status(404).json({ error: 'Commande non trouvee' });
  }

  const isClient = (order as any).client_id === userId;
  const isDriver = (order as any).driver_id === userId;

  let isRestaurantOwner = false;
  if ((order as any).restaurant_id) {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('owner_id')
      .eq('id', (order as any).restaurant_id)
      .single();
    isRestaurantOwner = (restaurant as any)?.owner_id === userId;
  }

  if (!isClient && !isDriver && !isRestaurantOwner) {
    return res.status(403).json({ error: 'Acces refuse' });
  }

  (req as any).orderOwnership = { isClient, isDriver, isRestaurantOwner };
  next();
}
