import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@djossfood/database';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function verifyOtp(phone: string, token: string): Promise<{
  session?: any;
  profile?: Profile;
  isNewUser?: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) return { error: 'Code invalide ou expiré' };
  if (!data.user) return { error: 'Erreur de connexion' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const isNewUser = !profile?.full_name;

  return {
    session: data.session,
    profile: profile as Profile | undefined,
    isNewUser,
  };
}

export async function signInWithEmail(email: string, password: string): Promise<{
  session?: any;
  profile?: Profile;
  isNewUser?: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: 'Identifiants incorrects' };
  if (!data.user) return { error: 'Erreur de connexion' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const isNewUser = !profile?.full_name;

  return {
    session: data.session,
    profile: profile as Profile | undefined,
    isNewUser,
  };
}

export async function updateUserName(fullName: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  if (error) return { error: error.message };

  await supabase
    .from('profiles')
    .update({ full_name: fullName, is_verified: true })
    .eq('id', (await supabase.auth.getUser()).data.user?.id || '');

  return {};
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}