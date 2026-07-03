import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../lib/api';
import { useRoomsStore } from '../../store/roomsStore';
import { Avatar } from '../common/Avatar';
import type { UserSummary } from '../../../../shared/events';

/** Создание группы: имя + поиск/выбор участников по юзернейму. */
export function NewGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [picked, setPicked] = useState<UserSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  const upsert = useRoomsStore((s) => s.upsert);
  const setActive = useRoomsStore((s) => s.setActive);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!query.trim()) return setResults([]);
    debounce.current = setTimeout(async () => {
      const found = await api.searchUsers(query).catch(() => []);
      setResults(found.filter((u) => !picked.some((p) => p.id === u.id)));
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [query, picked]);

  function reset() {
    setName('');
    setQuery('');
    setResults([]);
    setPicked([]);
    setBusy(false);
  }

  async function create() {
    if (busy) return;
    setBusy(true);
    try {
      const room = await api.createGroup(name, picked.map((p) => p.username));
      upsert(room);
      setActive(room.id);
      reset();
      onClose();
    } catch {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-hairline bg-panel p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Новая группа</h2>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название группы"
              className="mb-3 w-full rounded-lg bg-panel-hi px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyber"
            />

            {picked.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {picked.map((p) => (
                  <span
                    key={p.id}
                    className="flex items-center gap-1 rounded-full bg-cyber/15 px-2 py-1 text-xs text-cyber"
                  >
                    @{p.username}
                    <button onClick={() => setPicked(picked.filter((x) => x.id !== p.id))}>×</button>
                  </span>
                ))}
              </div>
            )}

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Добавить участников: @username…"
              className="w-full rounded-lg bg-panel-hi px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyber"
            />
            {results.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-hairline">
                {results.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setPicked([...picked, u]);
                      setQuery('');
                      setResults([]);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-cyber/10"
                  >
                    <Avatar user={u} size="sm" />
                    <span>
                      <p className="text-sm">{u.displayName}</p>
                      <p className="text-xs text-muted">@{u.username}</p>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted hover:text-gray-200">
                Отмена
              </button>
              <button
                onClick={() => void create()}
                disabled={busy || !name.trim()}
                className="rounded-lg bg-cyber px-4 py-2 text-sm font-semibold text-charcoal disabled:opacity-30"
              >
                Создать
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
