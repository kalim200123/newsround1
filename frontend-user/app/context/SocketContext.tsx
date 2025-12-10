"use client";

import { BACKEND_BASE_URL } from "@/lib/constants";
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useNotifications } from "./NotificationContext"; // Import useNotifications
import { Notification } from "@/lib/types/notification"; // Import Notification type

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  userCount: number;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const { addNotification } = useNotifications(); // Use the notification context
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0); // Remove unreadCount state from here

  // 방 참여/퇴장 헬퍼 함수
  const joinRoom = (room: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join_room", room);
    }
  };

  const leaveRoom = (room: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave_room", room);
    }
  };

  useEffect(() => {
    if (token && !socketRef.current) {
      // Initialize socket only if token exists and no socket is currently active in the ref
      const newSocket = io(BACKEND_BASE_URL, {
        auth: { token: token },
        transports: ["websocket"],
        reconnectionAttempts: 5,
        timeout: 60000,
        reconnectionDelay: 5000,
      });

      newSocket.on("connect", () => {
        setIsConnected(true);
        setError(null);
        console.log("Socket connected");
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        console.log("Socket disconnected");
      });

      newSocket.on("connect_error", (err) => {
        setError(`실시간 서버 연결 오류: ${err.message}`);
        setIsConnected(false);
      });

      // 알림 이벤트 리스너
      newSocket.on("new_notification", (data: Notification) => {
        console.log("New notification received:", data);
        addNotification(data); // Use addNotification from NotificationContext
      });

      // 사용자 수 이벤트 리스너
      newSocket.on("user_count", (count: number) => {
        console.log("User count updated:", count);
        setUserCount(count);
      });

      socketRef.current = newSocket;
      Promise.resolve().then(() => setSocket(newSocket)); // Defer state update
    } else if (!token && socketRef.current) {
      // Disconnect if token is removed and a socket exists
      socketRef.current.disconnect();
      socketRef.current = null;
      Promise.resolve().then(() => setSocket(null)); // Defer state update
      Promise.resolve().then(() => setIsConnected(false));
    } else if (token && socketRef.current && typeof socketRef.current.auth === 'object' && socketRef.current.auth !== null && 'token' in socketRef.current.auth && socketRef.current.auth.token !== token) {
      // If token changes for an existing socket, update auth token and force reconnect
      socketRef.current.auth.token = token;
      socketRef.current.disconnect(); // Force disconnect to trigger reconnect with new token
      socketRef.current.connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [token, addNotification]); // Added addNotification to dependencies

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        error,
        userCount,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
