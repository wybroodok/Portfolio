/** Zustand store — user session, per-user audit history, upload flow. */
import { create } from "zustand";
import { analyzeFile, getUserAudits, registerUser, getUser } from "./api";

const LS_KEY = "logiqai_user";

function loadSavedUser() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useStore = create((set, get) => ({
  // session
  user: loadSavedUser(),
  authReady: false, // becomes true once we've validated any saved session

  // navigation
  tab: "dashboard",

  // audit data (per user)
  history: [], // AuditRecord[], newest first
  selectedId: null, // which audit the tabs display

  // upload flow
  status: "idle", // idle | uploading | error
  progress: 0,
  error: null,
  _timer: null,

  setTab: (tab) => set({ tab }),

  /** Validate a saved session on boot and load its history. */
  init: async () => {
    const u = get().user;
    if (u) {
      const fresh = await getUser(u.id); // 404 → stale session
      if (fresh) {
        await get().loadHistory();
      } else {
        localStorage.removeItem(LS_KEY);
        set({ user: null });
      }
    }
    set({ authReady: true });
  },

  register: async (username) => {
    const user = await registerUser(username.trim());
    localStorage.setItem(LS_KEY, JSON.stringify(user));
    set({ user, tab: "dashboard" });
    await get().loadHistory();
    return user;
  },

  logout: () => {
    localStorage.removeItem(LS_KEY);
    set({ user: null, history: [], selectedId: null, status: "idle", tab: "dashboard" });
  },

  loadHistory: async () => {
    const u = get().user;
    if (!u) return;
    try {
      const history = await getUserAudits(u.id);
      set((s) => ({
        history,
        selectedId: s.selectedId && history.some((a) => a.id === s.selectedId)
          ? s.selectedId
          : history[0]?.id ?? null,
      }));
    } catch {
      /* leave history as-is */
    }
  },

  select: (id) => set({ selectedId: id }),

  /** The audit currently shown across tabs. */
  current: () => {
    const { history, selectedId } = get();
    return history.find((a) => a.id === selectedId) || history[0] || null;
  },

  analyze: async (file) => {
    const u = get().user;
    if (!u) return;
    const prev = get()._timer;
    if (prev) clearInterval(prev);

    set({ status: "uploading", progress: 6, error: null });

    const timer = setInterval(() => {
      const p = get().progress;
      if (p < 90) set({ progress: Math.min(90, p + Math.random() * 9 + 2) });
    }, 260);
    set({ _timer: timer });

    try {
      const record = await analyzeFile(u.id, file);
      clearInterval(timer);
      set({ progress: 100, _timer: null });
      setTimeout(() => {
        set((s) => ({
          status: "idle",
          progress: 0,
          history: [record, ...s.history],
          selectedId: record.id,
          tab: "dashboard",
        }));
      }, 380);
    } catch (err) {
      clearInterval(timer);
      set({ status: "error", error: err.message || "Analysis failed", _timer: null });
    }
  },
}));
