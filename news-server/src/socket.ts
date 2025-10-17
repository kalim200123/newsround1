import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import pool from "./config/db";

// 소켓에 사용자 정보를 추가하기 위한 타입 확장
interface AuthenticatedSocket extends Socket {
  user?: jwt.JwtPayload & { 
    userId: number;
    name: string;
  };
}

const initializeSocket = (io: Server) => {

  // [추가] 소켓 미들웨어: 모든 연결에 대해 JWT 인증 수행
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }

    const jwtSecret = process.env.USER_JWT_SECRET || "default_fallback_secret";
    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
      if (err) {
        console.error("[Socket Auth] Invalid token:", err.message);
        return next(new Error("Authentication error: Invalid token"));
      }
      // 소켓 객체에 사용자 정보를 저장하여, 나중에 활용
      socket.user = decoded;
      next();
    });
  });

  // 사용자가 소켓 서버에 새로 연결되었을 때 실행됩니다.
  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user;
    // 인증 미들웨어를 통과했으므로, user 객체는 항상 존재합니다.
    console.log(`[Socket] Authenticated user connected: ${user?.name} (${socket.id})`);

    socket.on("join_room", (room: string) => {
      socket.join(room);
      console.log(`[Socket] User ${user?.name} joined room: ${room}`);
    });

    // [수정] author를 클라이언트에서 받지 않고, 인증된 토큰의 사용자 정보를 사용
    socket.on("send_message", async (data: { room: string; message: string; }) => {
      if (!user) return; // 타입스크립트용 안전장치

      const topicId = parseInt(data.room, 10);
      if (isNaN(topicId)) {
        console.error(`[Socket] Invalid room format received: ${data.room}`);
        socket.emit("error_message", { message: "Invalid room format." });
        return;
      }

      // 1. 다른 사용자에게 메시지 실시간 전송
      socket.to(data.room).emit("receive_message", {
        message: data.message,
        author: user.name, // 토큰에서 가져온 사용자 이름
      });

      // 2. 받은 메시지를 DB에 저장
      try {
        await pool.query(
          "INSERT INTO tn_chat (topic_id, user_id, content) VALUES (?, ?, ?)",
          [topicId, user.userId, data.message]
        );
        console.log(`[DB] Message from ${user.name} to room ${data.room} saved to database.`);
      } catch (dbError) {
        console.error(`[DB] Failed to save message for room ${data.room}:`, dbError);
        socket.emit("error_message", { message: "Failed to save message." });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User ${user?.name} disconnected: ${socket.id}`);
    });

    socket.on("error", (error) => {
      console.error(`[Socket] Error for user ${user?.name}:`, error);
    });
  });
};

export default initializeSocket;