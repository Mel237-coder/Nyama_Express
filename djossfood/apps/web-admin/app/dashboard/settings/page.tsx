'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAdminEmail(user.email || '');
        setAdminName(user.user_metadata?.full_name || '');
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Profil administrateur</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Nom</p>
            <p className="font-medium">{adminName || 'Non defini'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{adminEmail || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium">Administrateur</p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
      >
        Deconnexion
      </Button>
    </div>
  );
}