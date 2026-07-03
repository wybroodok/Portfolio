import { useCallback, useEffect, useRef } from 'react';
import { socketManager } from '../lib/socket/SocketManager';

const FLUSH_INTERVAL = 400; // батчим read-события: один emit на пачку, а не на каждое

/**
 * Read-статусы через IntersectionObserver.
 *
 * Компонент сообщения регистрирует свой DOM-узел через возвращаемый `observe`.
 * Когда узел попадает в зону видимости, его id копится в буфер; буфер
 * сбрасывается на сервер пачкой раз в FLUSH_INTERVAL — это резко снижает
 * число сокет-эмитов при быстрой прокрутке ленты.
 */
export function useReadReceipts(roomId: string | null) {
  const bufferRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const observerRef = useRef<IntersectionObserver | null>(null);
  // node -> messageId, чтобы по entry.target достать id.
  const nodeToId = useRef(new WeakMap<Element, string>());

  const flush = useCallback(() => {
    if (!roomId || bufferRef.current.size === 0) return;
    socketManager.markRead(roomId, [...bufferRef.current]);
    bufferRef.current.clear();
  }, [roomId]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = nodeToId.current.get(entry.target);
          if (id) {
            bufferRef.current.add(id);
            observerRef.current?.unobserve(entry.target); // читаем один раз
          }
        }
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = setTimeout(flush, FLUSH_INTERVAL);
      },
      { threshold: 0.6 },
    );
    return () => {
      observerRef.current?.disconnect();
      clearTimeout(flushTimerRef.current);
    };
  }, [flush]);

  /** Ref-колбэк для DOM-узла сообщения: <div ref={observe(msg.id)} />. */
  const observe = useCallback(
    (messageId: string) => (node: Element | null) => {
      if (!node || !observerRef.current) return;
      nodeToId.current.set(node, messageId);
      observerRef.current.observe(node);
    },
    [],
  );

  return { observe };
}
