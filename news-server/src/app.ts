console.log("Application starting...");

import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import fs from "fs";
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";

import pool from "./config/db";
import { specs } from "./config/swagger";
import initializeSocket, { userSocketMap } from "./socket";

import adminRouter from "./routes/admin";
import apiRouter from "./routes/api";
import articlesRouter from "./routes/articles";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import commentsRouter from "./routes/comments";
import inquiryRouter from "./routes/inquiry";
import internalRouter from "./routes/internal";
import jobsRouter from "./routes/jobs";
import notificationRouter from "./routes/notification";
import savedRouter from "./routes/saved";
import userRouter from "./routes/user";

const app: Express = express();
app.set("trust proxy", 1); // 프록시 뒤의 실제 IP를 req.ip에 기록
const port = Number(process.env.PORT ?? 4001);

// --- CORS 설정 ---
const allowedOrigins = [
  "http://localhost:4001",
  "http://localhost:3000", // Local Dev Frontend
  "http://localhost:5173", // Local Vite Dev
  "https://news-frontend-jg.vercel.app", // Production Frontend
  "https://news02.onrender.com", // Production Backend (old)
  "https://news01.onrender.com", // Production Backend (new)
];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Vercel Preview URL Pattern
    const vercelPreviewPattern = /^https:\/\/news-frontend-.*-leejaegwons-projects\.vercel\.app$/;

    // origin이 없거나(예: 서버 내 요청), 허용된 목록에 있거나, Vercel 패턴과 일치하면 허용
    if (!origin || allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: Origin ${origin} is not whitelisted.`));
    }
  },
  credentials: true, // 인증 정보(쿠키, 토큰 등)를 포함한 요청 허용
};

// 전역 미들웨어
app.use(cors(corsOptions)); // 수정된 CORS 옵션 적용
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: true }));

// Swagger UI
const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// 방문자 로깅 미들웨어
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // API 요청 중 GET만 기록 (정적 파일, api-docs 제외)
  if (req.method === "GET" && req.path.startsWith("/api") && !req.path.startsWith("/api-docs")) {
    const userIdentifier = req.ip || "unknown";
    const userAgent = req.get("user-agent") || null;
    const path = req.path;

    // 비동기로 처리 (응답 속도에 영향 없도록)
    setImmediate(async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        // 하루에 한 번만 기록 (같은 날, 같은 IP는 중복 방지)
        await pool.query(
          `INSERT INTO tn_visitor_log (user_identifier, user_agent, path, created_at)
           SELECT ?, ?, ?, NOW()
           WHERE NOT EXISTS (
             SELECT 1 FROM tn_visitor_log
             WHERE user_identifier = ? AND DATE(created_at) = ?
           )`,
          [userIdentifier, userAgent, path, userIdentifier, today]
        );
      } catch (error) {
        // 로깅 실패는 무시 (서비스에 영향 없도록)
        console.error("[Visitor Log] Failed to log visitor:", error);
      }
    });
  }
  next();
});

// API 라우터
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/inquiry", inquiryRouter);
app.use("/api", commentsRouter);
app.use("/api/saved", savedRouter);
app.use("/api/internal", internalRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api", apiRouter); // MUST be before chatRouter to handle /api/topics/:topicId
app.use("/api/topics/:topicId/chat", chatRouter); // 토픽에 종속된 채팅 내역 조회
app.use("/api/chat", chatRouter); // 개별 채팅 메시지 관리 (삭제, 신고 등)

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

  console.error(errorLog); // Print the full error to the console for cloud logging

  console.error("예상하지 못한 서버 오류가 발생했습니다. logs/server_errors.log를 확인하세요.");
  res.status(500).json({ message: "서버 내부 오류가 발생했습니다." });
});

// HTTP 서버 및 소켓 서버 생성
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [...allowedOrigins, /^https:\/\/news-frontend-.*-leejaegwons-projects\.vercel\.app$/],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 소켓 로직 초기화
initializeSocket(io);

// 모든 라우터에서 io 객체를 쓸 수 있도록 app에 등록
app.set("io", io);
app.set("userSocketMap", userSocketMap);

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
