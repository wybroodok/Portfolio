import { AnimatePresence, motion } from 'framer-motion';
import { useConnectionStore } from '../../store/connectionStore';

/** Мягкий оффлайн/reconnect-баннер. Не блокирует UI — данные чата остаются. */
export function ConnectionBanner() {
  const status = useConnectionStore((s) => s.status);
  const hidden = status === 'online';

  const label =
    status === 'reconnecting'
      ? 'Переподключение…'
      : status === 'offline'
        ? 'Нет соединения — работаем в оффлайн-режиме'
        : 'Подключение…';

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -32, opacity: 0 }}
          className="fixed inset-x-0 top-0 z-50 flex justify-center py-1.5 text-sm
                     bg-electric/10 text-electric backdrop-blur"
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-electric" />
            {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
