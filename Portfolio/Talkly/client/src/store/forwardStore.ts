import { create } from 'zustand';
import type { ChatMessage } from '../../../shared/events';

interface ForwardState {
  message: ChatMessage | null;
  open: (message: ChatMessage) => void;
  close: () => void;
}

/** Сообщение, выбранное для пересылки (модалка выбирает целевой чат). */
export const useForwardStore = create<ForwardState>((set) => ({
  message: null,
  open: (message) => set({ message }),
  close: () => set({ message: null }),
}));
