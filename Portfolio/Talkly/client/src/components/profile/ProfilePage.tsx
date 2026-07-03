import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useRoomsStore } from '../../store/roomsStore';
import { usePresenceStore } from '../../store/presenceStore';
import { toast } from '../../store/toastStore';
import { formatPresence } from '../../lib/presence';
import { Avatar } from '../common/Avatar';
import type { UserProfile } from '../../../../shared/events';

const SWATCHES = ['#A855F7', '#EC4899', '#14B8A6', '#F43F5E', '#8B5CF6', '#22D3EE', '#FBBF24'];

/**
 * Полноэкранная страница профиля.
 * Свой — редактируемый; форма инициализируется ОДИН раз при открытии, чтобы
 * смена цвета/аватара не сбрасывала недописанное имя/описание.
 */
export function ProfilePage({
  username,
  onClose,
  onOpenChat,
  onLogout,
}: {
  username: string | null;
  onClose: () => void;
  onOpenChat: (roomId: string) => void;
  onLogout: () => void;
}) {
  const me = useAuthStore((s) => s.me);
  const patchMe = useAuthStore((s) => s.patchMe);
  const upsert = useRoomsStore((s) => s.upsert);
  const presence = usePresenceStore((s) => s.states);

  const isOwn = !username || username === me?.username;
  const [profile, setProfile] = useState<UserProfile | null>(isOwn ? me : null);
  // Черновик формы — единый источник для полей; на сервер уходит только по «Сохранить».
  const [form, setForm] = useState({ displayName: '', bio: '', avatarColor: '#A855F7' });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Инициализация ТОЛЬКО при смене цели профиля (username), не при каждом обновлении me.
  useEffect(() => {
    if (isOwn) {
      const m = useAuthStore.getState().me;
      if (m) {
        setProfile(m);
        setForm({ displayName: m.displayName, bio: m.bio ?? '', avatarColor: m.avatarColor });
      }
    } else if (username) {
      api.getUser(username).then(setProfile).catch(() => setProfile(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function save() {
    setSaving(true);
    try {
      const updated = await api.updateMe({
        displayName: form.displayName.trim(),
        bio: form.bio,
        avatarColor: form.avatarColor,
      });
      patchMe(updated);
      setProfile(updated);
      toast.success('Изменения сохранены');
    } catch (e) {
      toast.error((e as Error).message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  async function changeAvatar(file: File) {
    try {
      const { attachment } = await api.upload(file);
      const updated = await api.updateMe({ avatarUrl: attachment.url });
      patchMe(updated);
      setProfile(updated);
      toast.success('Фото обновлено');
    } catch {
      toast.error('Не удалось загрузить фото');
    }
  }

  async function writeTo() {
    if (!profile) return;
    const room = await api.createDm(profile.username);
    upsert(room);
    onOpenChat(room.id);
  }

  if (!profile) return <div className="grid h-full place-items-center bg-charcoal text-muted">Загрузка…</div>;

  // Аватар для превью: свой берём из формы (цвет реактивно), чужой — из профиля.
  const avatarUser = isOwn ? { ...profile, avatarColor: form.avatarColor } : profile;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-y-auto bg-charcoal">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <button onClick={onClose} className="mb-8 text-sm text-muted transition-colors hover:text-gray-200">
          ← Назад к чатам
        </button>

        <div className="flex flex-col items-center text-center">
          <motion.div layout className="relative">
            <Avatar user={avatarUser} size="xl" presence={!isOwn} />
            {isOwn && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void changeAvatar(f);
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-cyber text-charcoal transition-transform hover:scale-110"
                  title="Сменить фото"
                >
                  ✎
                </button>
              </>
            )}
          </motion.div>

          <p className="mt-4 text-sm text-muted">@{profile.username}</p>
          {!isOwn && <p className="text-xs text-muted">{formatPresence(presence[profile.id])}</p>}
        </div>

        {isOwn ? (
          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-1 block text-xs text-muted">Отображаемое имя</label>
              <input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                className="w-full rounded-lg bg-panel px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyber"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">О себе</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                maxLength={280}
                placeholder="Пара слов о себе…"
                className="w-full resize-none rounded-lg bg-panel px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyber"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">Цвет аватара</label>
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, avatarColor: c }))}
                    style={{ background: c }}
                    className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-charcoal transition-all ${
                      form.avatarColor === c ? 'scale-110 ring-white' : 'ring-transparent hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={onLogout} className="text-sm text-rose-400 hover:underline">
                Выйти из аккаунта
              </button>
              <button
                onClick={() => void save()}
                disabled={saving}
                className="rounded-lg bg-cyber px-6 py-2.5 text-sm font-semibold text-charcoal transition-transform hover:scale-[1.03] disabled:opacity-40"
              >
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            <h2 className="text-center text-xl font-semibold">{profile.displayName}</h2>
            {profile.bio && <p className="text-center text-sm text-gray-300">{profile.bio}</p>}
            <div className="flex justify-center">
              <button
                onClick={() => void writeTo()}
                className="rounded-lg bg-cyber px-6 py-2.5 text-sm font-semibold text-charcoal transition-transform hover:scale-[1.03]"
              >
                Написать
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
