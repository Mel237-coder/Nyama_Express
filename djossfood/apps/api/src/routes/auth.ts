import { Router, Request, Response } from 'express';
import { getSupabaseClient, getSupabaseAdmin } from '../config/supabase';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();

const otpRateLimit = rateLimitMiddleware({ keyPrefix: 'otp', maxRequests: 5, windowMs: 15 * 60 * 1000 });

// POST /api/auth/send-otp
router.post('/send-otp', otpRateLimit, async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Le numero de telephone est requis' });
  }

  try {
    const supabase = getSupabaseClient();

    // Supabase Auth with phone OTP
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: 'OTP envoye avec succes' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Numero de telephone et OTP requis' });
  }

  try {
    const supabase = getSupabaseClient();

    // Verify OTP with Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    if (error || !data.user) {
      return res.status(401).json({ error: 'OTP invalide ou expire' });
    }

    // Fetch the user profile
    const accessToken = data.session?.access_token;
    const adminClient = getSupabaseClient();
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profil non trouve' });
    }

    return res.json({
      token: accessToken,
      user: profile,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la verification de l\'OTP' });
  }
});

// POST /api/auth/admin-signup — protected by secret header
router.post('/admin-signup', async (req: Request, res: Response) => {
  const adminSecret = process.env.ADMIN_SIGNUP_SECRET;
  const providedSecret = req.headers['x-admin-signup-secret'];

  if (!adminSecret || providedSecret !== adminSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { email, password, full_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: full_name || 'Admin',
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: 'Compte administrateur cree avec succes',
      user: data.user,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la creation du compte admin' });
  }
});

export const authRouter = router;