import { create } from 'zustand';
import type { Room, RoomId } from '../../../shared/events';

interface RoomsState {
  rooms: Room[];
  activeRoomId: RoomId | null;
  setRooms: (rooms: Room[]) => void;
  /** Вставить или обновить комнату (из REST-ответа или socket room:upsert). */
  upsert: (room: Room) => void;
  setActive: (roomId: RoomId | null) => void;
}

export const useRoomsStore = create<RoomsState>((set) => ({
  rooms: [],
  activeRoomId: null,
  setRooms: (rooms) => set({ rooms }),
  upsert: (room) =>
    set((s) => {
      const idx = s.rooms.findIndex((r) => r.id === room.id);
      if (idx === -1) return { rooms: [...s.rooms, room] };
      const next = s.rooms.slice();
      next[idx] = room;
      return { rooms: next };
    }),
  setActive: (roomId) => set({ activeRoomId: roomId }),
}));
