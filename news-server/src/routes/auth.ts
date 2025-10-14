import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import pool from "../config/db";

type ExistingUserRow = RowDataPacket & {
  email: string;
  nickname: string;
  phone: string | null;
};

const router = Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 사용자 회원가입
 *     description: 새로운 사용자를 시스템에 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - nickname
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "홍길동"
 *               nickname:
 *                 type: string
 *                 example: "gildong_hong"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "gildong@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *               phone:
 *                 type: string
 *                 example: "010-1234-5678"
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회원가입이 완료되었습니다."
 *       400:
 *         description: 필수 입력 필드 누락
 *       409:
 *         description: 이메일, 닉네임, 또는 전화번호 중복
 *       500:
 *         description: 서버 내부 오류
 */
router.post("/signup", async (req: Request, res: Response) => {
  const { name, nickname, email, password, phone } = req.body ?? {};

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedNickname = typeof nickname === "string" ? nickname.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  const trimmedPhone = typeof phone === "string" ? phone.trim() : "";

  if (!trimmedName || !trimmedNickname || !trimmedEmail || typeof password !== "string" || password.length === 0) {
    return res.status(400).json({ message: "필수 정보를 모두 입력해 주세요." });
  }

  try {
    const conditions: string[] = ["email = ?", "nickname = ?"];
    const params: Array<string> = [trimmedEmail, trimmedNickname];

    if (trimmedPhone) {
      conditions.push("phone = ?");
      params.push(trimmedPhone);
    }

    const [existingUsers] = await pool.query<ExistingUserRow[]>(
      `SELECT email, nickname, phone FROM tn_user WHERE ${conditions.join(" OR ")}`,
      params
    );

    if (existingUsers.length > 0) {
      const emailExists = existingUsers.some((row) => row.email === trimmedEmail);
      const nicknameExists = existingUsers.some((row) => row.nickname === trimmedNickname);
      const phoneExists = trimmedPhone ? existingUsers.some((row) => row.phone === trimmedPhone) : false;

      if (emailExists) {
        return res.status(409).json({ message: "이미 사용 중인 이메일입니다." });
      }

      if (nicknameExists) {
        return res.status(409).json({ message: "이미 사용 중인 닉네임입니다." });
      }

      if (phoneExists) {
        return res.status(409).json({ message: "이미 등록된 휴대폰 번호입니다." });
      }

      return res.status(409).json({ message: "이미 등록된 사용자 정보가 존재합니다." });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await pool.query(
      "INSERT INTO tn_user (name, nickname, email, password, phone) VALUES (?, ?, ?, ?, ?)",
      [trimmedName, trimmedNickname, trimmedEmail, passwordHash, trimmedPhone || null]
    );

    res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 사용자 로그인
 *     description: 이메일과 비밀번호로 로그인하고 JWT 토큰을 발급받습니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "gildong@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: 로그인 성공, JWT 토큰 및 사용자 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "홍길동"
 *                     email:
 *                       type: string
 *                       example: "gildong@example.com"
 *                     nickname:
 *                       type: string
 *                       example: "gildong_hong"
 *       400:
 *         description: 이메일 또는 비밀번호 누락
 *       401:
 *         description: 잘못된 이메일 또는 비밀번호
 *       500:
 *         description: 서버 내부 오류
 */
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "이메일과 비밀번호를 모두 입력해주세요." });
  }

  try {
    const [users]: any = await pool.query("SELECT * FROM tn_user WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const user = users[0];

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const jwtSecret = process.env.USER_JWT_SECRET || "default_fallback_secret";
    if (jwtSecret === 'default_fallback_secret') {
        console.warn('Warning: USER_JWT_SECRET environment variable is not set. Using a default secret key for development.');
    }

    const token = jwt.sign({ userId: user.id, name: user.name }, jwtSecret, { expiresIn: "12h" });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, nickname: user.nickname },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

export default router;