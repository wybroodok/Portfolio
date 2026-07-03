import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLightboxStore } from '../../store/lightboxStore';
import { toast } from '../../store/toastStore';

/** Полноэкранный просмотр фото внутри мессенджера + сохранение файла. */
export function Lightbox() {
  const { url, name, close } = useLightboxStore();

  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [url, close]);

  async function save() {
    if (!url) return;
    try {
      // fetch → blob обходит игнор download при cross-origin и реально сохраняет файл.
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = name || 'image';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      toast.success('Файл сохранён');
    } catch {
      toast.error('Не удалось сохранить файл');
    }
  }

  return (
    <AnimatePresence>
      {url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-[70] flex flex-col bg-black/90 backdrop-blur-sm"
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="truncate text-sm text-gray-300">{name}</span>
            <div className="flex gap-2">
              <button
                onClick={save}
                className="rounded-lg bg-cyber px-4 py-1.5 text-sm font-semibold text-charcoal"
              >
                ↓ Сохранить
              </button>
              <button
                onClick={close}
                className="rounded-lg bg-panel px-3 py-1.5 text-sm text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
            <motion.img
              key={url}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={url}
              alt={name}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
