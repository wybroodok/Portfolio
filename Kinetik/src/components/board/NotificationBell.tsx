"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X, AlarmClock, CircleAlert } from "lucide-react";
import {
  getReminders,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationView,
} from "@/server/actions/notification-actions";

const POLL_MS = 60_000; // check for due tasks once a minute

export function NotificationBell({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<NotificationView[]>([]);
  const [open, setOpen] = useState(false);
  const shownIds = useRef<Set<string>>(new Set()); // browser-notified this session

  const poll = useCallback(async () => {
    try {
      const list = await getReminders(workspaceId);
      setItems(list);

      // Fire a native browser notification for each item we haven't shown yet.
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        for (const n of list) {
          if (!shownIds.current.has(n.id)) {
            shownIds.current.add(n.id);
            new Notification("Kinetik", { body: n.message });
          }
        }
      }
    } catch {
      /* not signed in / transient — ignore */
    }
  }, [workspaceId]);

  useEffect(() => {
    // Ask for browser-notification permission once.
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  async function dismiss(id: string) {
    setItems((xs) => xs.filter((x) => x.id !== id));
    await markNotificationRead(workspaceId, id);
  }

  async function dismissAll() {
    setItems([]);
    await markAllNotificationsRead(workspaceId);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Уведомления"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Bell className="h-4 w-4" />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-20 w-80 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-neutral-500">Напоминания</span>
            {items.length > 0 && (
              <button onClick={dismissAll} className="text-[11px] text-indigo-600 hover:underline">
                Прочитать все
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-neutral-400">Нет уведомлений</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  {n.type === "OVERDUE" ? (
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  ) : (
                    <AlarmClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  )}
                  <span className="flex-1 text-neutral-700 dark:text-neutral-300">{n.message}</span>
                  <button
                    onClick={() => dismiss(n.id)}
                    className="text-neutral-400 hover:text-neutral-600"
                    aria-label="Прочитано"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
