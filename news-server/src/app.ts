import cors from "cors";
import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import pool from "./config/db";
import { specs } from "./config/swagger";
import adminRouter from "./routes/admin";
import apiRouter from "./routes/api";
import userRouter from "./routes/user";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Swagger와 라우터 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api", apiRouter);
app.use("/admin", adminRouter);
app.use("/user", userRouter);

// 기본 경로
app.get("/", (req: Request, res: Response) => {
  res.send("Different News Server is running!");
});

// 서버 시작
app.listen(port, async () => {
  console.log(`Server is running at http://localhost:${port}`);
  try {
    const connection = await pool.getConnection();
    console.log("✅ DB connected successfully.");
    connection.release();
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
});
