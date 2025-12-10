"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/app/context/NotificationContext";
import { getUnreadCount } from "@/lib/api/notifications";
import { Bell } from "lucide-react";
import { useEffect } from "react";

export default function NotificationBadge() {
  const { unreadCount, setUnreadCount } = useNotifications();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      getUnreadCount(token)
        .then((count) => {
          setUnreadCount(count);
        })
        .catch(err => {
          // In case the API fails, we don't want to break the UI
          console.error("Failed to fetch unread notification count:", err);
        });
    }
  }, [token, setUnreadCount]);

  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-[--icon-adaptive] hover:text-foreground transition-transform group-hover:scale-125" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-md">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </div>
  );
}
