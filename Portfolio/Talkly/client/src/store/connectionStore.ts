import { create } from 'zustand';

export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting' | 'offline';

/**
 * Состояние транспортного соединения (для оффлайн-баннера).
 * Профиль пользователя живёт в authStore, здесь только статус линии.
 */
interface ConnectionState {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'connecting',
  setStatus: (status) => set({ status }),
}));
