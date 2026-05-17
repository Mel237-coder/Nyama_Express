import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../config/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const supabase = getSupabaseClient(token);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    req.userId = user.id;
    req.userRole = user.user_metadata?.role || 'client';
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}