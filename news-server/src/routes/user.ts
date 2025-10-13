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

// User signup
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

      return res.status(409).json({ message: "이미 등록된 사용자 정보가 있습니다." });
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

// User login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // Find user by email
    const [users]: any = await pool.query("SELECT * FROM tn_user WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = users[0];

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT
    // TODO: Move JWT_SECRET to environment variables
    const jwtSecret = "your_super_secret_jwt_key";
    const token = jwt.sign({ userId: user.id, name: user.name }, jwtSecret, { expiresIn: "1h" });

    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, nickname: user.nickname }
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
