'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useEffect, useState } from 'react';

interface AuthState {
  tempToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: { email: string; nombre: string } | null;
  selectedRol: { id: string; nombre: string } | null;
  roles: { id: string; nombre: string }[];
  setTempToken: (token: string) => void;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: { email: string; nombre: string }) => void;
  setSelectedRol: (rol: { id: string; nombre: string }) => void;
  setRoles: (roles: { id: string; nombre: string }[]) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tempToken: null,
      accessToken: null,
      refreshToken: null,
      user: null,
      selectedRol: null,
      roles: [],

      setTempToken: (token) => set({ tempToken: token }),
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      setSelectedRol: (rol) => set({ selectedRol: rol }),
      setRoles: (roles) => set({ roles }),
      logout: () =>
        set({
          tempToken: null,
          accessToken: null,
          refreshToken: null,
          user: null,
          selectedRol: null,
          roles: [],
        }),
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'auth-storage',
      storage: typeof window !== 'undefined' ? {
        getItem: (name) => {
          const raw = sessionStorage.getItem(name);
          return raw ? JSON.parse(raw) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      } : undefined,
      partialize: (state) => ({
        tempToken: state.tempToken,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        selectedRol: state.selectedRol,
        roles: state.roles,
      }) as AuthState,
    },
  ),
);

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = authStore.persist.onFinishHydration(() => setHydrated(true));
    if (authStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);
  return hydrated;
}
