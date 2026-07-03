import { API_URL } from '../../lib/api';
import { usePresenceStore } from '../../store/presenceStore';
import { isOnline } from '../../lib/presence';
import type { UserSummary } from '../../../../shared/events';

const SIZES = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-24 w-24 text-2xl',
} as const;

function resolveUrl(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

/** Аватар: фото или инициалы на фоне цвета, с опциональной точкой присутствия. */
export function Avatar({
  user,
  size = 'md',
  presence = false,
}: {
  user: Pick<UserSummary, 'id' | 'displayName' | 'avatarColor' | 'avatarUrl'>;
  size?: keyof typeof SIZES;
  presence?: boolean;
}) {
  const online = usePresenceStore((s) => isOnline(s.states[user.id]));
  const photo = resolveUrl(user.avatarUrl);

  return (
    <div className="relative shrink-0">
      {photo ? (
        <img
          src={photo}
          alt={user.displayName}
          className={`${SIZES[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${SIZES[size]} grid place-items-center rounded-full font-bold text-charcoal`}
          style={{ background: user.avatarColor }}
        >
          {user.displayName.slice(0, 2).toUpperCase()}
        </div>
      )}
      {presence && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-panel ${
            online ? 'bg-cyber' : 'bg-muted'
          }`}
        />
      )}
    </div>
  );
}
