import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { socketManager } from '../lib/socket/SocketManager';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { MessageKind, MessageStatus, type Attachment, type ChatMessage } from '../../../shared/events';

/**
 * Отправка с тремя статусами (Sending → Delivered → Read) и опциональным
 * вложением. clientId — идемпотентный ключ для reconcile и серверной дедупликации.
 */
export function useSendMessage(roomId: string | null) {
  return useCallback(
    async (body: string, media?: { attachment: Attachment; kind: MessageKind }) => {
      const text = body.trim();
      if (!roomId || (!text && !media)) return;

      const me = useAuthStore.getState().me;
      if (!me) return;

      const clientId = nanoid();
      const optimistic: ChatMessage = {
        id: `optimistic:${clientId}`,
        clientId,
        roomId,
        author: me,
        body: text,
        kind: media?.kind ?? MessageKind.Text,
        attachment: media?.attachment ?? null,
        status: MessageStatus.Sending,
        readBy: [],
        reactions: {},
        editedAt: null,
        forwardedFrom: null,
        createdAt: Date.now(),
      };

      const store = useChatStore.getState();
      store.addOptimistic(optimistic);

      try {
        const ack = await socketManager.sendMessage(roomId, clientId, text, media);
        if (ack.ok && ack.message) store.reconcile(roomId, clientId, ack.message);
        else store.markFailed(roomId, clientId);
      } catch {
        store.markFailed(roomId, clientId);
      }
    },
    [roomId],
  );
}
