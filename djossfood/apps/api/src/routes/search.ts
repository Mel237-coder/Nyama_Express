import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase';

const router = Router();

// GET /api/search?q=...&city=...&lat=...&lng=...
router.get('/', async (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const city = req.query.city as string | undefined;
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;

  if (!q) {
    return res.status(400).json({ error: 'Le parametre de recherche "q" est requis' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Call the search_restaurants RPC function
    const { data: results, error } = await supabase.rpc('search_restaurants', {
      p_query: q,
      p_city: city || null,
      p_user_lat: lat,
      p_user_lng: lng,
    });

    if (error) {
      console.error('Search RPC error:', error.message);
      return res.status(500).json({ error: 'Erreur lors de la recherche' });
    }

    // Log the search in search_logs table
    try {
      const userId = (req as any).userId || null;
      await supabase.from('search_logs').insert({
        user_id: userId,
        query: q,
        city: city || null,
        results_count: results?.length || 0,
      });
    } catch (logError: any) {
      // Don't fail the request if logging fails
      console.error('Search log error:', logError.message);
    }

    return res.json({ results: results || [] });
  } catch (err: any) {
    console.error('Search error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const searchRouter = router;