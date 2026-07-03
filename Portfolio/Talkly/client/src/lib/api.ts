import type { Attachment, MessageKind, Room, UserProfile, UserSummary } from '../../../shared/events';

export const API_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

let token: string | null = localStorage.getItem('talkly.token');

export function setToken(t: string | null): void {
  token = t;
  if (t) localStorage.setItem('talkly.token', t);
  else localStorage.removeItem('talkly.token');
}

export function getToken(): string | null {
  return token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((msg as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

type AuthResponse = { token: string; user: UserProfile };

export const api = {
  register: (username: string, displayName: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, displayName }),
    }),

  login: (username: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  me: () => request<UserProfile>('/me'),

  updateMe: (patch: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'avatarColor' | 'avatarUrl'>>) =>
    request<UserProfile>('/me', { method: 'PATCH', body: JSON.stringify(patch) }),

  searchUsers: (q: string) =>
    request<UserSummary[]>(`/users/search?q=${encodeURIComponent(q)}`),

  getUser: (username: string) => request<UserProfile>(`/users/${encodeURIComponent(username)}`),

  listRooms: () => request<Room[]>('/rooms'),

  createDm: (username: string) =>
    request<Room>('/rooms/dm', { method: 'POST', body: JSON.stringify({ username }) }),

  createGroup: (name: string, memberUsernames: string[]) =>
    request<Room>('/rooms/group', { method: 'POST', body: JSON.stringify({ name, memberUsernames }) }),

  addMember: (roomId: string, username: string) =>
    request<Room>(`/rooms/${roomId}/members`, { method: 'POST', body: JSON.stringify({ username }) }),

  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ attachment: Attachment; kind: MessageKind }>('/upload', {
      method: 'POST',
      body: form,
    });
  },
};
