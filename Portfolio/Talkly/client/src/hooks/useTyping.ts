import { useCallback, useEffect, useRef } from 'react';
import { socketManager } from '../lib/socket/SocketManager';

const IDLE_TIMEOUT = 3_000; // авто-затухание «typing…» через 3 c бездействия
const THROTTLE = 1_500; // не чаще одного typing:start раз в 1.5 c

/**
 * Оптимизированный индикатор набора текста.
 *
 * Микро-оптимизация трафика:
 *   - typing:start шлётся НЕ на каждую клавишу, а не чаще раза в THROTTLE;
 *   - typing:stop отправляется автоматически через IDLE_TIMEOUT после
 *     последнего нажатия (или сразу при отправке сообщения / уходе из комнаты).
 *
 * Возвращает onKeystroke (дёргать на каждый ввод) и stop (форс-стоп).
 */
export function useTyping(roomId: string | null) {
  const lastStartRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);

  const stop = useCallback(() => {
    if (!roomId || !isTypingRef.current) return;
    isTypingRef.current = false;
    clearTimeout(idleTimerRef.current);
    socketManager.stopTyping(roomId);
  }, [roomId]);

  const onKeystroke = useCallback(() => {
    if (!roomId) return;
    const now = Date.now();

    // Отправляем start только на переходе «не печатал → печатает» и не чаще THROTTLE.
    if (!isTypingRef.current || now - lastStartRef.current > THROTTLE) {
      isTypingRef.current = true;
      lastStartRef.current = now;
      socketManager.startTyping(roomId);
    }

    // Перезапускаем таймер затухания на каждое нажатие.
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stop, IDLE_TIMEOUT);
  }, [roomId, stop]);

  // Смена комнаты / размонтирование — гарантированно гасим индикатор.
  useEffect(() => stop, [roomId, stop]);

  return { onKeystroke, stop };
}
