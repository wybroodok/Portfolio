import { useState } from 'react';
import { motion } from 'framer-motion';
import { api, setToken } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

type Mode = 'register' | 'login';

/**
 * Первый вход: создание аккаунта по @username (+ имя) или вход существующим.
 * Пароля в дев-режиме нет — вход по юзернейму.
 */
export function AuthScreen({ onAuthed }: { onAuthed: (token: string) => void }) {
  const [mode, setMode] = useState<Mode>('register');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setMe = useAuthStore((s) => s.setMe);

  async function submit() {
    const u = username.trim();
    if (!u || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === 'register'
          ? await api.register(u, displayName.trim() || u)
          : await api.login(u);
      setToken(res.token);
      setMe(res.user);
      onAuthed(res.token);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="grid h-full place-items-center bg-charcoal px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-hairline bg-panel p-8 shadow-xl"
      >
        <h1 className="mb-1 text-2xl font-bold tracking-tight">
          Talk<span className="text-cyber">ly</span>
        </h1>
        <p className="mb-6 text-sm text-muted">
          {mode === 'register' ? 'Создайте аккаунт — придумайте юзернейм.' : 'Вход по юзернейму.'}
        </p>

        <label className="mb-1 block text-xs text-muted">Юзернейм</label>
        <div className="mb-3 flex items-center rounded-lg bg-panel-hi px-3 focus-within:ring-1 focus-within:ring-cyber">
          <span className="text-muted">@</span>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
            placeholder="ada_lovelace"
            className="w-full bg-transparent px-2 py-2.5 text-sm text-gray-100 placeholder:text-muted focus:outline-none"
          />
        </div>

        {mode === 'register' && (
          <>
            <label className="mb-1 block text-xs text-muted">Отображаемое имя</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
              placeholder="Ada Lovelace"
              className="mb-3 w-full rounded-lg bg-panel-hi px-4 py-2.5 text-sm text-gray-100 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyber"
            />
          </>
        )}

        {error && <p className="mb-3 text-xs text-electric">{error}</p>}

        <button
          onClick={() => void submit()}
          disabled={!username.trim() || busy}
          className="w-full rounded-lg bg-cyber py-2.5 text-sm font-semibold text-charcoal transition-opacity disabled:opacity-30"
        >
          {busy ? '…' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
        </button>

        <button
          onClick={() => {
            setMode(mode === 'register' ? 'login' : 'register');
            setError(null);
          }}
          className="mt-4 w-full text-center text-xs text-muted hover:text-gray-300"
        >
          {mode === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'}
        </button>
      </motion.div>
    </div>
  );
}
