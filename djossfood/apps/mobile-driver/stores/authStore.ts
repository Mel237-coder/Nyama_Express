import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile, Driver } from '@djossfood/database';

interface AuthState {
  session: { access_token: string; refresh_token: string } | null;
  profile: Profile | null;
  driver: Driver | null;
  isAuthenticated: boolean;
  isApproved: boolean;
  setSession: (session: any) => void;
  setProfile: (profile: Profile | null) => void;
  setDriver: (driver: Driver | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      profile: null,
      driver: null,
      isAuthenticated: false,
      isApproved: false,

      setSession: (session) =>
        set({
          session,
          isAuthenticated: !!session?.access_token,
        }),

      setProfile: (profile) => set({ profile }),

      setDriver: (driver) =>
        set({
          driver,
          isApproved: !!driver?.is_approved,
        }),

      signOut: () =>
        set({
          session: null,
          profile: null,
          driver: null,
          isAuthenticated: false,
          isApproved: false,
        }),
    }),
    {
      name: 'djossfood-driver-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        session: state.session,
        profile: state.profile,
        driver: state.driver,
        isAuthenticated: state.isAuthenticated,
        isApproved: state.isApproved,
      }),
    },
  ),
);