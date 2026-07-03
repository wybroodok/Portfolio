import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '../../store/chatStore';

/** «User is typing…» с анимированными точками. Автоматически исчезает. */
export function TypingIndicator({ roomId }: { roomId: string }) {
  const typing = useChatStore((s) => s.rooms[roomId]?.typing ?? {});
  const names = Object.values(typing);

  const label =
    names.length === 0
      ? ''
      : names.length === 1
        ? `${names[0]} печатает`
        : names.length === 2
          ? `${names[0]} и ${names[1]} печатают`
          : `${names.length} человек печатают`;

  return (
    <div className="h-6 px-6">
      <AnimatePresence>
        {names.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex items-center gap-2 text-xs text-cyber"
          >
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-1 animate-typing-bounce rounded-full bg-cyber"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            {label}…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
