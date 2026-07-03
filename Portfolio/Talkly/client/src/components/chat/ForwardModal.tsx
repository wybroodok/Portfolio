import { nanoid } from 'nanoid';
import { AnimatePresence, motion } from 'framer-motion';
import { useForwardStore } from '../../store/forwardStore';
import { useRoomsStore } from '../../store/roomsStore';
import { useAuthStore } from '../../store/authStore';
import { socketManager } from '../../lib/socket/SocketManager';
import { toast } from '../../store/toastStore';
import { roomTitle, roomFace } from '../../lib/rooms';
import { Avatar } from '../common/Avatar';
import { MessageKind } from '../../../../shared/events';

/** Пересылка выбранного сообщения в другой чат. */
export function ForwardModal() {
  const message = useForwardStore((s) => s.message);
  const close = useForwardStore((s) => s.close);
  const rooms = useRoomsStore((s) => s.rooms);
  const activeRoomId = useRoomsStore((s) => s.activeRoomId);
  const me = useAuthStore((s) => s.me);

  async function forwardTo(roomId: string) {
    if (!message || !me) return;
    try {
      // Чтобы отправить в чужую комнату, надо в неё войти на сокете (сервер проверит членство).
      const joined = roomId === activeRoomId ? { ok: true } : await socketManager.joinRoom(roomId);
      if (!joined.ok) throw new Error('join failed');

      const media =
        message.attachment && message.kind !== MessageKind.Text
          ? { attachment: message.attachment, kind: message.kind }
          : undefined;
      await socketManager.sendMessage(roomId, nanoid(), message.body, media, message.author.displayName);

      if (roomId !== activeRoomId) socketManager.leaveRoom(roomId);
      toast.success('Переслано');
      close();
    } catch {
      toast.error('Не удалось переслать');
    }
  }

  return (
    <AnimatePresence>
      {message && me && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-[65] grid place-items-center bg-black/60 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[70vh] w-full max-w-sm flex-col rounded-2xl border border-hairline bg-panel p-5"
          >
            <h2 className="mb-3 text-lg font-semibold">Переслать в…</h2>
            <div className="-mx-1 flex-1 overflow-y-auto">
              {rooms.map((room) => {
                const face = roomFace(room, me.id);
                return (
                  <button
                    key={room.id}
                    onClick={() => void forwardTo(room.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-panel-hi"
                  >
                    {face ? (
                      <Avatar user={face} size="md" />
                    ) : (
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-cyber/20 text-cyber">#</div>
                    )}
                    <span className="truncate text-sm">{roomTitle(room, me.id)}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={close} className="mt-3 text-sm text-muted hover:text-gray-200">
              Отмена
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
