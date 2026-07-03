import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useForwardStore } from '../../store/forwardStore';
import { useLightboxStore } from '../../store/lightboxStore';
import { socketManager } from '../../lib/socket/SocketManager';
import { toast } from '../../store/toastStore';
import { API_URL } from '../../lib/api';
import { MessageKind, MessageStatus, type Attachment, type ChatMessage } from '../../../../shared/events';

const EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '😢'];

/** Чёткий индикатор доставки: часы → серые галочки → синие галочки (прочитано). */
function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === MessageStatus.Sending) {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-muted">
        <title>Отправляется</title>
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3l2 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  const read = status === MessageStatus.Read;
  return (
    <svg viewBox="0 0 20 16" className={`h-3.5 w-4 ${read ? 'text-electric' : 'text-muted'}`}>
      <title>{read ? 'Прочитано' : 'Доставлено'}</title>
      <path d="M2 8.5 5 11.5 11 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8.5 11 11.5 17 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function resolveUrl(url: string): string {
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentView({ a, kind }: { a: Attachment; kind: MessageKind }) {
  const url = resolveUrl(a.url);
  const openLightbox = useLightboxStore((s) => s.open);

  if (kind === MessageKind.Image) {
    return (
      <button onClick={() => openLightbox(url, a.name)} className="block">
        <img src={url} alt={a.name} className="max-h-72 max-w-full rounded-lg object-cover" />
      </button>
    );
  }
  if (kind === MessageKind.Video) {
    return <video src={url} controls className="max-h-72 max-w-full rounded-lg" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download={a.name}
      className="flex items-center gap-3 rounded-lg bg-black/20 px-3 py-2 hover:bg-black/40"
    >
      <span className="grid h-9 w-9 place-items-center rounded-md bg-cyber/25 text-cyber">📎</span>
      <span className="min-w-0">
        <p className="truncate text-sm">{a.name}</p>
        <p className="text-xs text-muted">{fmtSize(a.size)}</p>
      </span>
    </a>
  );
}

export function MessageBubble(props: {
  message: ChatMessage;
  observe: (id: string) => (node: Element | null) => void;
}) {
  const { message } = props;
  const me = useAuthStore((s) => s.me);
  const applyEdit = useChatStore((s) => s.applyEdit);
  const openForward = useForwardStore((s) => s.open);

  const mine = me?.id === message.author.id;
  const hasMedia = message.kind !== MessageKind.Text && message.attachment;
  const canEdit = mine && message.kind === MessageKind.Text && !message.id.startsWith('optimistic:');

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [picker, setPicker] = useState(false);

  const react = (emoji: string) => {
    socketManager.reactMessage(message.roomId, message.id, emoji);
    setPicker(false);
  };

  async function saveEdit() {
    const body = draft.trim();
    if (!body || body === message.body) return setEditing(false);
    const ack = await socketManager.editMessage(message.roomId, message.id, body);
    if (ack.ok && ack.message) {
      applyEdit(message.roomId, ack.message);
      setEditing(false);
    } else {
      toast.error('Не удалось изменить');
    }
  }

  function copy() {
    void navigator.clipboard.writeText(message.body);
    toast.success('Скопировано');
  }

  const reactionEntries = Object.entries(message.reactions ?? {});

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
      ref={mine ? undefined : props.observe(message.id)}
      className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[75%] gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
        {!mine && (
          <div
            className="mt-auto grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-charcoal"
            style={{ background: message.author.avatarColor }}
          >
            {message.author.displayName.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="relative">
          {/* Тулбар действий — появляется на hover */}
          <div
            className={`absolute -top-3 z-10 flex items-center gap-0.5 rounded-full border border-hairline bg-panel px-1 py-0.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100 ${
              mine ? 'right-0' : 'left-0'
            }`}
          >
            <button onClick={() => setPicker((v) => !v)} title="Реакция" className="rounded-full px-1.5 hover:bg-panel-hi">
              🙂
            </button>
            <button onClick={() => openForward(message)} title="Переслать" className="rounded-full px-1.5 text-sm hover:bg-panel-hi">
              ↪
            </button>
            {message.body && (
              <button onClick={copy} title="Скопировать" className="rounded-full px-1.5 text-sm hover:bg-panel-hi">
                ⧉
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => {
                  setDraft(message.body);
                  setEditing(true);
                }}
                title="Изменить"
                className="rounded-full px-1.5 text-sm hover:bg-panel-hi"
              >
                ✎
              </button>
            )}
          </div>

          {/* Пикер эмодзи */}
          <AnimatePresence>
            {picker && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute -top-11 z-20 flex gap-1 rounded-full border border-hairline bg-panel px-2 py-1 shadow-lg ${
                  mine ? 'right-0' : 'left-0'
                }`}
              >
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => react(e)} className="text-lg transition-transform hover:scale-125">
                    {e}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              mine ? 'border border-cyber/25 bg-cyber/15 text-gray-100' : 'bg-panel text-gray-200'
            } ${message.status === MessageStatus.Sending ? 'opacity-70' : ''}`}
          >
            {message.forwardedFrom && (
              <p className="mb-1 border-l-2 border-cyber/50 pl-2 text-xs italic text-muted">
                Переслано от {message.forwardedFrom}
              </p>
            )}
            {!mine && (
              <p className="mb-0.5 text-xs font-semibold" style={{ color: message.author.avatarColor }}>
                {message.author.displayName}
              </p>
            )}

            {hasMedia && (
              <div className="mb-1.5">
                <AttachmentView a={message.attachment!} kind={message.kind} />
              </div>
            )}

            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void saveEdit();
                    }
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  className="w-full resize-none rounded-lg bg-charcoal/50 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyber"
                  rows={2}
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button onClick={() => setEditing(false)} className="text-muted hover:text-gray-200">
                    Отмена
                  </button>
                  <button onClick={() => void saveEdit()} className="font-semibold text-cyber">
                    Сохранить
                  </button>
                </div>
              </div>
            ) : (
              message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>
            )}

            {/* Время + «изменено» + галочки — тесно */}
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] leading-none text-muted">
              {message.editedAt && <span className="italic">изменено</span>}
              <time>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
              {mine && <StatusIcon status={message.status} />}
            </div>
          </div>

          {/* Реакции */}
          {reactionEntries.length > 0 && (
            <div className={`mt-1 flex flex-wrap gap-1 ${mine ? 'justify-end' : ''}`}>
              {reactionEntries.map(([emoji, users]) => {
                const reacted = !!me && users.includes(me.id);
                return (
                  <button
                    key={emoji}
                    onClick={() => react(emoji)}
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                      reacted ? 'bg-cyber/25 text-cyber' : 'bg-panel-hi text-gray-300 hover:bg-panel-hi/70'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{users.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
