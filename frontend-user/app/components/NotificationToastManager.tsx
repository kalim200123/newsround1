// app/components/NotificationToastManager.tsx
"use client";

import { useNotifications } from "@/app/context/NotificationContext";
import NotificationToast from "./notifications/NotificationToast";

export default function NotificationToastManager() {
    const { latestNotification, clearLatestNotification } = useNotifications();
    
    return (
        <NotificationToast
            notification={latestNotification}
            onDismiss={clearLatestNotification}
        />
    );
}
