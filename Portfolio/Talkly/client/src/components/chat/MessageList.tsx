import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { socketManager } from '../../lib/socket/SocketManager';
import { useChatStore } from '../../store/chatStore';
import { useReadReceipts } from '../../hooks/useReadReceipts';
import { MessageBubble } from './MessageBubble';

/**
 * Лента сообщений: авто-скролл вниз на новые, подгрузка старой истории при
 * скролле к верху (keyset-пагинация), и регистрация read-receipts через
 * IntersectionObserver.
 */
export function MessageList({ roomId }: { roomId: string }) {
  const room = useChatStore((s) => s.rooms[roomId]);
  const prependHistory = useChatStore((s) => s.prependHistory);
  const { observe } = useReadReceipts(roomId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const messages = room?.messages ?? [];
  const count = messages.length;

  // Держим ленту у нижнего края при появлении новых сообщений.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (nearBottom) el.scrollTo({ top: el.scrollHeight });
  }, [count]);

  async function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop > 80 || loadingRef.current || !room?.hasMore) return;
    const oldest = messages[0];
    if (!oldest) return;

    loadingRef.current = true;
    const prevHeight = el.scrollHeight;
    const ack = await socketManager.loadHistory(roomId, oldest.createdAt);
    if (ack.ok) {
      prependHistory(roomId, ack.messages, ack.hasMore);
      // Сохраняем позицию просмотра после вставки старых сообщений сверху.
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    }
    loadingRef.current = false;
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex-1 space-y-1 overflow-y-auto px-6 py-4"
    >
      <AnimatePresence initial={false}>
        {messages.map((m) => (
          <MessageBubble key={m.clientId} message={m} observe={observe} />
        ))}
      </AnimatePresence>
    </div>
  );
}
