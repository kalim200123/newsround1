// app/context/NotificationContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { Notification } from "@/lib/types/notification";

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  latestNotification: Notification | null; // For the toast
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  clearLatestNotification: () => void; // To dismiss the toast
  isSidePanelOpen: boolean;
  toggleSidePanel: (isOpen?: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const addNotification = (newNotification: Notification) => {
    setNotifications((prev) => [newNotification, ...prev]);
    if (!newNotification.is_read) {
      setUnreadCount((prev) => prev + 1);
    }
    // Set this new notification to be displayed as a toast
    setLatestNotification(newNotification);
  };

  const markAsRead = (id: number) => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.is_read) {
        setNotifications((prev) =>
            prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
    setUnreadCount(0);
  };
  
  const clearLatestNotification = () => {
    setLatestNotification(null);
  };

  const toggleSidePanel = (isOpen?: boolean) => {
    setIsSidePanelOpen((prev) => (isOpen !== undefined ? isOpen : !prev));
  };

  const value = {
    unreadCount,
    notifications,
    latestNotification,
    addNotification,
    markAsRead,
    markAllAsRead,
    setUnreadCount,
    clearLatestNotification,
    isSidePanelOpen,
    toggleSidePanel,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}