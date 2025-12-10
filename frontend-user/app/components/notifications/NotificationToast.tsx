// app/components/notifications/NotificationToast.tsx
"use client";

import { Notification, NotificationType } from "@/lib/types/notification";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AlertCircle, Bell, Clock, Megaphone, Star, UserPlus, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationToastProps {
  notification: Notification | null;
  onDismiss: () => void;
}

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

export default function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      const showTimer = setTimeout(() => setIsVisible(true), 10);
      let dismissTimer: NodeJS.Timeout;
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        // Allow time for the exit animation before calling onDismiss
        dismissTimer = setTimeout(onDismiss, 500);
      }, 5000); // Disappear after 5 seconds

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        if (dismissTimer) clearTimeout(dismissTimer);
      };
    }
  }, [notification, onDismiss]);
  
  const handleToastClick = () => {
    if (notification?.url) {
      router.push(notification.url);
      setIsVisible(false);
      onDismiss();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && notification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={handleToastClick}
          className="fixed bottom-5 right-5 w-full max-w-sm bg-card border border-border shadow-2xl rounded-2xl cursor-pointer z-100 dark:bg-black"
        >
          <div className="p-4 flex items-start gap-4">
             <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-secondary mt-1">
                {getIcon(notification.type)}
            </div>
            <div className="flex-1 dark:text-white">
                <h4 className="font-bold text-foreground dark:text-white">새로운 알림</h4>
                <p className="text-sm text-muted-foreground line-clamp-2 dark:text-gray-300">{notification.message}</p>
                 <div className="text-xs text-muted-foreground/80 mt-1 dark:text-gray-400">
                    {formatRelativeTime(notification.created_at)}
                </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                onDismiss();
              }}
              className="p-1 rounded-full text-muted-foreground hover:bg-accent absolute top-2 right-2 dark:text-gray-400"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}