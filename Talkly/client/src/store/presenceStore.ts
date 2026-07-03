import { create } from 'zustand';
import type { PresenceState, UserId } from '../../../shared/events';

export interface Presence {
  state: PresenceState;
  lastSeen?: number | null;
}

interface PresenceStore {
  states: Record<UserId, Presence>;
  setPresence: (userId: UserId, presence: Presence) => void;
}

export const usePresenceStore = create<PresenceStore>((set) => ({
  states: {},
  setPresence: (userId, presence) =>
    set((s) => ({ states: { ...s.states, [userId]: presence } })),
}));
