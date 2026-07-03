import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Трёхпанельный layout: каналы → чат → информационная панель.
 * Правая панель сворачивается/разворачивается с плавной анимацией ширины.
 */
export function ThreePanelLayout(props: {
  sidebar: ReactNode;
  main: ReactNode;
  aside: ReactNode;
  asideOpen: boolean;
}) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-charcoal">
      <nav className="w-64 shrink-0 border-r border-hairline bg-panel">{props.sidebar}</nav>
      <main className="flex min-w-0 flex-1 flex-col">{props.main}</main>
      <AnimatePresence initial={false}>
        {props.asideOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="hidden shrink-0 overflow-hidden border-l border-hairline bg-panel lg:block"
          >
            <div className="h-full w-72">{props.aside}</div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
