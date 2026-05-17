import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getSupabaseAdmin } from '../config/supabase';

const router = Router();

// All rating routes require authentication
router.use(authMiddleware);

// POST /api/ratings - Submit rating after completed order
router.post('/', async (req: AuthRequest, res: Response) => {
  const { order_id, restaurant_rating, driver_rating, restaurant_comment, driver_comment } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'L\'identifiant de la commande est requis' });
  }

  if (!restaurant_rating || restaurant_rating < 1 || restaurant_rating > 5) {
    return res.status(400).json({ error: 'La note du restaurant doit etre entre 1 et 5' });
  }

  if (driver_rating !== undefined && driver_rating !== null && (driver_rating < 1 || driver_rating > 5)) {
    return res.status(400).json({ error: 'La note du livreur doit etre entre 1 et 5' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Verify the order exists, is completed, and belongs to the caller
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, client_id, restaurant_id, driver_id, status, client_confirmed_delivery')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Commande non trouvee' });
    }

    if ((order as any).client_id !== req.userId) {
      return res.status(403).json({ error: 'Vous ne pouvez noter que vos propres commandes' });
    }

    if ((order as any).status !== 'completed') {
      return res.status(400).json({ error: 'Vous ne pouvez noter qu\'une commande terminee' });
    }

    // Check if rating already exists
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('order_id', order_id)
      .single();

    if (existingRating) {
      return res.status(409).json({ error: 'Cette commande a deja ete notee' });
    }

    // Insert the rating
    const { data: rating, error: ratingError } = await supabase
      .from('ratings')
      .insert({
        order_id,
        client_id: req.userId!,
        restaurant_id: (order as any).restaurant_id,
        driver_id: (order as any).driver_id || null,
        restaurant_rating,
        driver_rating: driver_rating || null,
        restaurant_comment: restaurant_comment || null,
        driver_comment: driver_comment || null,
      })
      .select()
      .single();

    if (ratingError) {
      console.error('Insert rating error:', ratingError.message);
      return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la notation' });
    }

    return res.status(201).json({ rating });
  } catch (err: any) {
    console.error('Submit rating error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const ratingsRouter = router;