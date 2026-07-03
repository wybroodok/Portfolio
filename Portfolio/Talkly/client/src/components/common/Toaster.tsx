import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../../store/toastStore';

const STYLES = {
  success: 'border-cyber/40 text-cyber',
  error: 'border-rose-500/50 text-rose-400',
  info: 'border-electric/40 text-electric',
} as const;

const ICONS = { success: '✓', error: '✕', info: 'ⓘ' } as const;

/** Мини-уведомления снизу по центру: результат сохранения, ошибки и т.п. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex items-center gap-2 rounded-full border bg-panel/95 px-4 py-2 text-sm shadow-lg backdrop-blur ${STYLES[t.kind]}`}
          >
            <span className="font-bold">{ICONS[t.kind]}</span>
            <span className="text-gray-200">{t.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
