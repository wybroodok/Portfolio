import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './lib/api';
import { socketManager } from './lib/socket/SocketManager';
import { useAuthStore } from './store/authStore';
import { useRoomsStore } from './store/roomsStore';
import { useSocketBindings } from './hooks/useSocketBindings';
import { AuthScreen } from './components/auth/AuthScreen';
import { ThreePanelLayout } from './components/layout/ThreePanelLayout';
import { ConnectionBanner } from './components/layout/ConnectionBanner';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatPanel } from './components/chat/ChatPanel';
import { InfoPanel } from './components/profile/InfoPanel';
import { ProfilePage } from './components/profile/ProfilePage';
import { ForwardModal } from './components/chat/ForwardModal';
import { Toaster } from './components/common/Toaster';
import { Lightbox } from './components/common/Lightbox';

export function App() {
  const [token, setTokenState] = useState<string | null>(getToken());
  return (
    <>
      {!token ? (
        <AuthScreen onAuthed={(t) => setTokenState(t)} />
      ) : (
        <AuthedApp token={token} onLogout={() => setTokenState(null)} />
      )}
      {/* Глобальные оверлеи — доступны на любом экране */}
      <Toaster />
      <Lightbox />
    </>
  );
}

type View = { mode: 'chat' } | { mode: 'profile'; username: string | null };

function AuthedApp({ token, onLogout }: { token: string; onLogout: () => void }) {
  useSocketBindings(token);

  const me = useAuthStore((s) => s.me);
  const setMe = useAuthStore((s) => s.setMe);
  const clearMe = useAuthStore((s) => s.clear);
  const rooms = useRoomsStore((s) => s.rooms);
  const activeRoomId = useRoomsStore((s) => s.activeRoomId);
  const setRooms = useRoomsStore((s) => s.setRooms);
  const setActive = useRoomsStore((s) => s.setActive);

  const [view, setView] = useState<View>({ mode: 'chat' });
  const [infoOpen, setInfoOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Восстановление сессии: профиль + список чатов.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profile, roomList] = await Promise.all([api.me(), api.listRooms()]);
        if (cancelled) return;
        setMe(profile);
        setRooms(roomList);
        if (!useRoomsStore.getState().activeRoomId && roomList[0]) setActive(roomList[0].id);
        setLoaded(true);
      } catch {
        // Невалидный токен — выкидываем на экран входа.
        doLogout();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doLogout() {
    socketManager.disconnect();
    setToken(null);
    clearMe();
    onLogout();
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  if (!me || !loaded) {
    return <div className="grid h-full place-items-center text-muted">Загрузка Talkly…</div>;
  }

  // Полноэкранная страница профиля поверх мессенджера.
  if (view.mode === 'profile') {
    return (
      <ProfilePage
        username={view.username}
        onClose={() => setView({ mode: 'chat' })}
        onLogout={doLogout}
        onOpenChat={(roomId) => {
          setActive(roomId);
          setView({ mode: 'chat' });
        }}
      />
    );
  }

  return (
    <>
      <ConnectionBanner />
      <ForwardModal />
      <ThreePanelLayout
        asideOpen={infoOpen && !!activeRoom}
        sidebar={<Sidebar onOpenProfile={() => setView({ mode: 'profile', username: null })} />}
        main={
          activeRoom ? (
            <ChatPanel
              room={activeRoom}
              infoOpen={infoOpen}
              onToggleInfo={() => setInfoOpen((v) => !v)}
            />
          ) : (
            <div className="grid h-full place-items-center text-muted">
              Выберите чат или найдите собеседника через поиск
            </div>
          )
        }
        aside={
          activeRoom ? (
            <InfoPanel
              room={activeRoom}
              onOpenUser={(username) => setView({ mode: 'profile', username })}
            />
          ) : null
        }
      />
    </>
  );
}
