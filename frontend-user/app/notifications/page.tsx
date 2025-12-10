// app/notifications/page.tsx
"use client";

import ClientPaginationControls from "@/app/components/common/ClientPaginationControls";
import ConfirmationPopover from "@/app/components/common/ConfirmationPopover";
import { EmptyState } from "@/app/components/common/EmptyState";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications as useNotificationContext } from "@/app/context/NotificationContext";
import { deleteNotification, getNotifications, markAllAsRead, markAsRead } from "@/lib/api/notifications";
import { Notification, NotificationType } from "@/lib/types/notification";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AlertCircle, Bell, Clock, Loader2, Megaphone, Star, UserPlus, X, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const NotificationItem = ({
  notification,
  onRead,
  onDelete,
  token,
}: {
  notification: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  token: string | null;
}) => {
  const router = useRouter();

  const handleNotificationClick = () => {
    // Prioritize user navigation. Mark as read in the background.
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
    e.stopPropagation(); // Prevent card click event
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
        "group relative flex items-start gap-4 p-4 rounded-xl cursor-pointer border",
        notification.is_read
          ? "bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
          : "bg-sky-100 dark:bg-sky-900 border-sky-300 dark:border-sky-700"
      )}
      onClick={handleNotificationClick}
    >
      <button
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground bg-card/50 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
        aria-label="Delete notification"
      >
        <X className="w-4 h-4" />
      </button>

      {notification.metadata?.thumbnail_url ? (
        <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden relative border border-border">
          <Image src={notification.metadata.thumbnail_url} alt="Thumbnail" fill sizes="64px" className="object-cover" />
        </div>
      ) : (
        <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-secondary">
          {getIcon(notification.type)}
        </div>
      )}
      <div className="flex-1">
        <p className="font-semibold text-foreground line-clamp-2 pr-6">{notification.message}</p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          {notification.metadata?.source_domain && (
            <Image
              src={`https://www.google.com/s2/favicons?domain=${notification.metadata.source_domain}&sz=16`}
              alt=""
              width={16}
              height={16}
              className="w-4 h-4"
              unoptimized
            />
          )}
          {notification.metadata?.source && <span>{notification.metadata.source}</span>}
          <span className="font-mono">{formatRelativeTime(notification.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const { markAsRead: markAsReadInContext, markAllAsRead: markAllAsReadInContext } = useNotificationContext();

  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications(token, 1, 100);
      setAllNotifications(data.notifications);
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
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return allNotifications.filter((n) => !n.is_read);
    }
    return allNotifications;
  }, [allNotifications, filter]);

  useEffect(() => {
    const count = filteredNotifications.length;
    setTotalPages(Math.ceil(count / limit));
    if (currentPage > Math.ceil(count / limit)) {
      setCurrentPage(1);
    }
  }, [filteredNotifications, limit, currentPage]);

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    return filteredNotifications.slice(startIndex, startIndex + limit);
  }, [filteredNotifications, currentPage, limit]);

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      await markAllAsRead(token);
      setAllNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      markAllAsReadInContext();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed to mark all as read:", err);
      }
    }
  };

  const handleNotificationRead = (id: number) => {
    setAllNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    markAsReadInContext(id);
  };

  const handleConfirmDelete = async () => {
    if (!token || deleteConfirmationId === null) return;

    try {
      await deleteNotification(token, deleteConfirmationId);
      setAllNotifications((prev) => prev.filter((n) => n.id !== deleteConfirmationId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Failed to delete notification:", err);
      }
      // Optionally, show a toast notification for the error
    } finally {
      setDeleteConfirmationId(null);
    }
  };

  const unreadCount = useMemo(() => allNotifications.filter((n) => !n.is_read).length, [allNotifications]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">알림 센터</h1>
        <p className="mt-2 text-lg text-muted-foreground">모든 업데이트를 한 곳에서 확인하세요.</p>
      </header>

      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-lg font-semibold text-sm transition-colors",
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-accent"
            )}
          >
            전체
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-4 py-2 rounded-lg font-semibold text-sm transition-colors relative",
              filter === "unread"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-accent"
            )}
          >
            안 읽음
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-colors disabled:opacity-50 text-sm font-semibold"
          disabled={unreadCount === 0}
        >
          모두 읽음으로 표시
        </button>
      </div>

      {deleteConfirmationId !== null && (
        <ConfirmationPopover
          title="알림 삭제"
          message="이 알림을 영구적으로 삭제하시겠습니까?"
          confirmText="삭제"
          cancelText="취소"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmationId(null)}
        />
      )}

      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      )}

      {error && <EmptyState Icon={AlertCircle} title="오류 발생" description={error} />}

      {!loading && !error && paginatedNotifications.length === 0 && (
        <EmptyState
          Icon={Bell}
          title="알림이 없습니다"
          description={filter === "unread" ? "모든 알림을 확인했습니다." : "새로운 활동이 없습니다."}
        />
      )}

      {!loading && !error && paginatedNotifications.length > 0 && (
        <>
          <div className="space-y-3">
            {paginatedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleNotificationRead}
                onDelete={setDeleteConfirmationId}
                token={token}
              />
            ))}
          </div>

          <ClientPaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
}
