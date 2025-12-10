// app/components/notifications/NotificationSidePanel.tsx
"use client";

import ConfirmationPopover from "@/app/components/common/ConfirmationPopover";
import Favicon from "@/app/components/common/Favicon";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications as useNotificationContext } from "@/app/context/NotificationContext";
import { deleteNotification, getNotifications, markAllAsRead, markAsRead } from "@/lib/api/notifications";
import { Notification, NotificationType } from "@/lib/types/notification";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Bell, Clock, Megaphone, Star, UserPlus, X, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const NotificationItem = ({
  notification,
  onRead,
  onDelete,
  token,
  onClosePanel,
}: {
  notification: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  token: string | null;
  onClosePanel: () => void;
}) => {
  const router = useRouter();

  const handleNotificationClick = () => {
    // console.log("Notification clicked:", notification);
    onClosePanel();
    if (notification.url) {
      router.push(notification.url);
    }
    if (!notification.is_read && token) {
      markAsRead(token, notification.id)
        .then(() => onRead(notification.id))
        .catch((error) => console.error("Failed to mark notification as read in background:", error));
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const getIcon = (type: NotificationType) => {
    const iconClasses = "w-6 h-6";
    switch (type) {
      case NotificationType.NEW_TOPIC:
        return <Zap className={cn(iconClasses, "text-purple-500")} />;
      case NotificationType.BREAKING_NEWS:
        return <AlertCircle className={cn(iconClasses, "text-red-500")} />;
      case NotificationType.EXCLUSIVE_NEWS:
        return <Star className={cn(iconClasses, "text-yellow-500")} />;
      case NotificationType.VOTE_REMINDER:
        return <Clock className={cn(iconClasses, "text-blue-500")} />;
      case NotificationType.ADMIN_NOTICE:
        return <Megaphone className={cn(iconClasses, "text-green-500")} />;
      case NotificationType.FRIEND_REQUEST:
        return <UserPlus className={cn(iconClasses, "text-indigo-500")} />;
      default:
        return <Bell className={cn(iconClasses, "text-zinc-500")} />;
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer border",
        notification.is_read
          ? "bg-zinc-900/50 dark:bg-zinc-900/50 border-zinc-800 dark:border-zinc-800"
          : "bg-zinc-800 dark:bg-zinc-800 border-zinc-700 dark:border-zinc-700"
      )}
      onClick={handleNotificationClick}
    >
      <button
        onClick={handleDeleteClick}
        className="absolute top-1 right-1 p-1 rounded-full text-muted-foreground bg-card/50 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
        aria-label="Delete notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {notification.metadata?.thumbnail_url ? (
        <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden relative border border-border">
          <Image src={notification.metadata.thumbnail_url} alt="Thumbnail" fill sizes="48px" className="object-cover" />
        </div>
      ) : (
        <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-secondary mt-1">
          {getIcon(notification.type)}
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground line-clamp-3 pr-4">{notification.message}</p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          {notification.metadata?.source_domain && (
            <Favicon
              src={`https://www.google.com/s2/favicons?domain=${notification.metadata.source_domain}&sz=16`}
              alt=""
              size={16}
              className="w-4 h-4 rounded-sm"
            />
          )}
          {notification.metadata?.source && (
            <span className="truncate max-w-[100px]">{notification.metadata.source}</span>
          )}
          <span className="font-mono whitespace-nowrap">{formatRelativeTime(notification.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default function NotificationSidePanel() {
  const { token } = useAuth();
  const {
    isSidePanelOpen,
    toggleSidePanel,
    markAsRead: markAsReadInContext,
    markAllAsRead: markAllAsReadInContext,
  } = useNotificationContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications(token, 1, 10);
      setNotifications(data.notifications);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알림을 불러오는데 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isSidePanelOpen) {
      fetchNotifications();
    }
  }, [isSidePanelOpen, fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      await markAllAsRead(token);
      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
      markAllAsReadInContext();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed to mark all as read:", err.message);
      }
    }
  };

  const handleNotificationRead = (id: number) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif)));
    markAsReadInContext(id);
  };

  const handleConfirmDelete = async () => {
    if (!token || deleteConfirmationId === null) return;
    try {
      await deleteNotification(token, deleteConfirmationId);
      setNotifications((prev) => prev.filter((n) => n.id !== deleteConfirmationId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed to delete notification:", err.message);
      }
    } finally {
      setDeleteConfirmationId(null);
    }
  };

  const unreadCount = notifications.filter((notif) => !notif.is_read).length;

  return (
    <AnimatePresence>
      {isSidePanelOpen && (
        <>
          {deleteConfirmationId !== null && (
            <ConfirmationPopover
              title="알림 삭제"
              message="이 알림을 삭제하시겠습니까?"
              confirmText="삭제"
              cancelText="취소"
              onConfirm={handleConfirmDelete}
              onCancel={() => setDeleteConfirmationId(null)}
            />
          )}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.2 }}
            className={`fixed top-0 right-0 h-full w-full max-w-xs ${
              isDarkMode ? "bg-black" : "bg-white"
            } shadow-lg z-50 flex flex-col`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-foreground">알림</h2>
                <button
                  onClick={() => toggleSidePanel(false)}
                  className="p-1 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="알림 패널 닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-between items-center text-sm">
                <Link
                  href="/notifications"
                  onClick={() => toggleSidePanel(false)}
                  className="text-primary hover:underline"
                >
                  전체 보기
                </Link>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={unreadCount === 0}
                  >
                    모두 읽음으로 표시
                  </button>
                )}
              </div>
            </div>

            <div
              className={`absolute top-24 left-0 right-0 h-px ${isDarkMode ? "bg-gray-600" : "bg-gray-300"} z-50`}
            ></div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading && <p className="text-center text-zinc-500">알림을 불러오는 중...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}

              {!loading && !error && notifications.length === 0 && (
                <div className="text-center p-8 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
                  <p className="text-zinc-500">새로운 알림이 없습니다.</p>
                </div>
              )}

              {!loading && !error && notifications.length > 0 && (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={handleNotificationRead}
                      onDelete={setDeleteConfirmationId}
                      token={token}
                      onClosePanel={() => toggleSidePanel(false)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
