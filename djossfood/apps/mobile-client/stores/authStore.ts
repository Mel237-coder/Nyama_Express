import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getSecureItem, setSecureItem, deleteSecureItem } from '../services/secureStorage';
import type { Profile } from '@djossfood/database';

const secureStorage = {
  getItem: async (name: string) => {
    const value = await getSecureItem(name);
    return value ?? null;
  },
  setItem: setSecureItem,
  removeItem: deleteSecureItem,
};

interface AuthState {
  session: { access_token: string; refresh_token: string } | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  setSession: (session: any) => void;
  setProfile: (profile: Profile | null) => void;
  setIsNewUser: (isNewUser: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      profile: null,
      isAuthenticated: false,
      isNewUser: false,

      setSession: (session) =>
        set({
          session,
          isAuthenticated: !!session?.access_token,
        }),

      setProfile: (profile) => set({ profile }),

      setIsNewUser: (isNewUser) => set({ isNewUser }),

      signOut: () =>
        set({
          session: null,
          profile: null,
          isAuthenticated: false,
          isNewUser: false,
        }),
    }),
    {
      name: 'djossfood-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        session: state.session,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);