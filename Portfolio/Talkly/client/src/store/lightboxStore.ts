import { create } from 'zustand';

interface LightboxState {
  url: string | null;
  name: string;
  open: (url: string, name: string) => void;
  close: () => void;
}

/** Просмотр изображения во весь экран внутри мессенджера. */
export const useLightboxStore = create<LightboxState>((set) => ({
  url: null,
  name: '',
  open: (url, name) => set({ url, name }),
  close: () => set({ url: null, name: '' }),
}));
