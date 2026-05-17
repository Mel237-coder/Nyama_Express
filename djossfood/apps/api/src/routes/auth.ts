import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';

const router = Router();

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
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

export const authRouter = router;