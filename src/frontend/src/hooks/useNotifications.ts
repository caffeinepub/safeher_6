import { useCallback, useState } from "react";
import type { AppNotification } from "../types";

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useNotifications() {
  const [notifications, setNotificationsState] = useState<AppNotification[]>(
    () => readLS<AppNotification[]>("safeher_notifications", []),
  );

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
      const notification: AppNotification = {
        ...n,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        read: false,
      };
      setNotificationsState((prev) => {
        const next = [notification, ...prev].slice(0, 50);
        writeLS("safeher_notifications", next);
        return next;
      });
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setNotificationsState((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      writeLS("safeher_notifications", next);
      return next;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotificationsState((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      writeLS("safeher_notifications", next);
      return next;
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, addNotification, markAllRead, markRead, unreadCount };
}
