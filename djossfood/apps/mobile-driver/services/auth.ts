import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Profile, Driver } from '@djossfood/database';
import { useAuthStore } from '../stores/authStore';
import api from './api';

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
  driver?: Driver;
  isNewUser?: boolean;
  isApproved?: boolean;
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

  // Check for driver profile
  let driver: Driver | null = null;
  if (profile) {
    try {
      const response = await api.get<Driver>('/api/drivers/me', {
        headers: { Authorization: `Bearer ${data.session?.access_token}` },
      });
      driver = response.data;
    } catch {
      // Driver profile does not exist yet — user may need to register
    }
  }

  return {
    session: data.session,
    profile: profile as Profile | undefined,
    driver: driver ?? undefined,
    isNewUser,
    isApproved: !!driver?.is_approved,
  };
}

export async function registerDriver(data: {
  vehicle_type: string;
  vehicle_plate: string;
  license_number: string;
}): Promise<{ driver?: Driver; error?: string }> {
  try {
    const response = await api.post<Driver>('/api/driver-owner/register', data);
    return { driver: response.data };
  } catch (err: any) {
    return { error: err.response?.data?.error || 'Erreur lors de l\'inscription' };
  }
}

export async function uploadDocuments(data: FormData): Promise<{ error?: string }> {
  try {
    await api.post('/api/driver-owner/documents', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {};
  } catch (err: any) {
    return { error: err.response?.data?.error || 'Erreur lors de l\'envoi des documents' };
  }
}

export async function fetchDriverProfile(): Promise<{ driver?: Driver; error?: string }> {
  try {
    const response = await api.get<Driver>('/api/drivers/me');
    const driver = response.data;
    useAuthStore.getState().setDriver(driver);
    return { driver };
  } catch (err: any) {
    return { error: err.response?.data?.error || 'Erreur lors du chargement du profil chauffeur' };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  useAuthStore.getState().signOut();
}