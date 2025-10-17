import cors from "cors";
import dotenv from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { createServer } from "http";
import { Server } from "socket.io";

import pool from "./config/db";
import { specs } from "./config/swagger";
import initializeSocket from "./socket";

import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import apiRouter from "./routes/api";
import articlesRouter from "./routes/articles";
import jobsRouter from "./routes/jobs";
import chatRouter from "./routes/chat";

dotenv.config();

const app: Express = express();
const port = Number(process.env.PORT ?? 3000);

// 전역 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// API 라우터
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/topics/:topicId/chat", chatRouter); // 토픽에 종속된 채팅 내역 조회
app.use("/api/chat", chatRouter); // 개별 채팅 메시지 관리 (삭제, 신고 등)
app.use("/api", apiRouter);

// 헬스 체크
app.get("/", (req: Request, res: Response) => {
  res.send("Different News 서버가 정상적으로 실행 중입니다.");
});

// 전역 에러 핸들러
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const logDir = path.join(__dirname, "..", "..", "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const errorLog = `
[${new Date().toISOString()}] 처리되지 않은 서버 오류 발생: ${err.message}
상세 오류 객체: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}
Stack: ${err.stack}
`;
  fs.appendFileSync(path.join(logDir, "server_errors.log"), errorLog);

  console.error("예상하지 못한 서버 오류가 발생했습니다. logs/server_errors.log를 확인하세요.");
  res.status(500).json({ message: "서버 내부 오류가 발생했습니다." });
});

// HTTP 서버 및 소켓 서버 생성
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 소켓 로직 초기화
initializeSocket(io);

// 서버 기동
httpServer.listen(port, async () => {
  console.log(`Different News 서버가 http://localhost:${port} 에서 실행 중입니다.`);
  try {
    const connection = await pool.getConnection();
    console.log("데이터베이스 연결에 성공했습니다.");
    connection.release();
  } catch (err) {
    console.error("데이터베이스 연결에 실패했습니다:", err);
  }
});

export default app;
