import { create } from 'zustand';
import type { UserProfile } from '../../../shared/events';

interface AuthState {
  me: UserProfile | null;
  setMe: (me: UserProfile) => void;
  patchMe: (patch: Partial<UserProfile>) => void;
  clear: () => void;
}

/** Текущий авторизованный пользователь (профиль — источник истины из БД). */
export const useAuthStore = create<AuthState>((set) => ({
  me: null,
  setMe: (me) => set({ me }),
  patchMe: (patch) => set((s) => (s.me ? { me: { ...s.me, ...patch } } : s)),
  clear: () => set({ me: null }),
}));
