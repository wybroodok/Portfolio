import { useRef, useState, type KeyboardEvent } from 'react';
import { useSendMessage } from '../../hooks/useSendMessage';
import { useTyping } from '../../hooks/useTyping';
import { api } from '../../lib/api';

export function MessageInput({ roomId }: { roomId: string }) {
  const [value, setValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const send = useSendMessage(roomId);
  const { onKeystroke, stop } = useTyping(roomId);

  async function submitText() {
    const text = value.trim();
    if (!text) return;
    setValue('');
    stop();
    await send(text);
  }

  async function onFile(file: File) {
    setUploading(true);
    try {
      const media = await api.upload(file);
      const caption = value.trim();
      setValue('');
      stop();
      await send(caption, media);
    } catch {
      /* тихо игнорируем сбой загрузки; можно показать тост */
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitText();
    }
  }

  return (
    <div className="border-t border-hairline px-6 py-4">
      <div className="flex items-end gap-2 rounded-xl border border-transparent bg-panel px-3 py-2 transition-colors focus-within:border-cyber/40">
        <input
          ref={fileRef}
          type="file"
          hidden
          accept="image/*,video/*,*/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Прикрепить файл"
          className="grid h-9 w-9 place-items-center rounded-lg text-lg text-muted hover:bg-panel-hi hover:text-cyber disabled:opacity-40"
        >
          {uploading ? '…' : '📎'}
        </button>
        <textarea
          rows={1}
          value={value}
          placeholder={uploading ? 'Загрузка файла…' : 'Сообщение…'}
          onChange={(e) => {
            setValue(e.target.value);
            onKeystroke();
          }}
          onKeyDown={onKeyDown}
          className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm text-gray-100 placeholder:text-muted focus:outline-none"
        />
        <button
          onClick={() => void submitText()}
          disabled={!value.trim()}
          className="rounded-lg bg-cyber px-4 py-1.5 text-sm font-semibold text-charcoal transition-opacity disabled:opacity-30"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
