import bcrypt from "bcryptjs";
import express, { Response } from "express";
import path from "path";
import pool from "../config/db";
import { validateChangePassword } from "../middleware/changePasswordValidation";
import { validateUpdateUser } from "../middleware/updateUserValidation";
import { AuthenticatedRequest, authenticateUser } from "../middleware/userAuth";

import fs from "fs";

const router = express.Router();

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     tags:
 *       - User
 *     summary: "내 정보 조회"
 *     description: "현재 로그인된 사용자의 프로필 정보를 조회합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "사용자 프로필 정보"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 nickname:
 *                   type: string
 *                 phone:
 *                   type: string
 *       401:
 *         description: "인증 실패"
 *       404:
 *         description: "사용자를 찾을 수 없음"
 */
router.get("/me", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  try {
    const [users]: any = await pool.query(
      "SELECT email, name, nickname, phone, profile_image_url, introduction FROM tn_user WHERE id = ? AND status = 'ACTIVE'",
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/user/me:
 *   put:
 *     tags:
 *       - User
 *     summary: "내 정보 수정"
 *     description: "현재 로그인된 사용자의 프로필 정보(닉네임, 프로필 이미지, 자기소개)를 수정합니다."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: "새로운 닉네임"
 *               profile_image_url:
 *                 type: string
 *                 description: "새로운 프로필 이미지 URL"
 *               introduction:
 *                 type: string
 *                 description: "새로운 자기소개 (최대 255자)"
 *     responses:
 *       200:
 *         description: "정보 수정 성공"
 *       400:
 *         description: "유효성 검사 실패"
 *       409:
 *         description: "닉네임 중복"
 */
router.put("/me", authenticateUser, validateUpdateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { nickname, profile_image_url, introduction } = req.body;

  if (!nickname && !profile_image_url && introduction === undefined) {
    return res.status(400).json({ message: "수정할 정보를 입력해주세요." });
  }

  try {
    // 프로필 이미지 URL 유효성 검사
    if (profile_image_url) {
      const avatarDir = path.join(__dirname, "../../public/avatars");
      const files = fs.readdirSync(avatarDir);
      const validUrls = files.map((file) => `/public/avatars/${file}`);
      if (!validUrls.includes(profile_image_url)) {
        return res.status(400).json({ field: "profile_image_url", message: "유효하지 않은 프로필 이미지입니다." });
      }
    }

    // 닉네임 중복 확인
    if (nickname) {
      const [existingUsers]: any = await pool.query("SELECT id FROM tn_user WHERE nickname = ? AND id != ?", [
        nickname,
        userId,
      ]);
      if (existingUsers.length > 0) {
        return res.status(409).json({ field: "nickname", message: "이미 사용 중인 닉네임입니다." });
      }
    }

    // 정보 업데이트
    const fieldsToUpdate = [];
    const params = [];
    if (nickname) {
      fieldsToUpdate.push("nickname = ?");
      params.push(nickname);
    }
    if (profile_image_url) {
      fieldsToUpdate.push("profile_image_url = ?");
      params.push(profile_image_url);
    }
    if (introduction !== undefined) {
      fieldsToUpdate.push("introduction = ?");
      params.push(introduction);
    }
    params.push(userId);

    const query = `UPDATE tn_user SET ${fieldsToUpdate.join(", ")} WHERE id = ?`;
    await pool.query(query, params);

    res.status(200).json({ message: "내 정보가 성공적으로 수정되었습니다." });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/user/me/password:
 *   put:
 *     tags:
 *       - User
 *     summary: "비밀번호 변경"
 *     description: "현재 로그인된 사용자의 비밀번호를 변경합니다."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - newPassword_confirmation
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *               newPassword_confirmation:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: "비밀번호 변경 성공"
 *       400:
 *         description: "유효성 검사 실패"
 *       401:
 *         description: "현재 비밀번호가 일치하지 않음"
 */
router.put(
  "/me/password",
  authenticateUser,
  validateChangePassword,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    try {
      const [users]: any = await pool.query("SELECT password FROM tn_user WHERE id = ?", [userId]);

      if (users.length === 0) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      const user = users[0];

      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ field: "currentPassword", message: "현재 비밀번호가 일치하지 않습니다." });
      }

      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      await pool.query("UPDATE tn_user SET password = ? WHERE id = ?", [newPasswordHash, userId]);

      res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  }
);

/**
 * @swagger
 * /api/user/me:
 *   delete:
 *     tags:
 *       - User
 *     summary: "회원 탈퇴"
 *     description: "현재 로그인된 사용자의 계정을 비활성화(탈퇴) 처리합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "회원 탈퇴 성공"
 *       401:
 *         description: "인증 실패"
 */
router.delete("/me", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    await pool.query("UPDATE tn_user SET status = 'DELETED' WHERE id = ?", [userId]);
    res.status(200).json({ message: "회원 탈퇴 처리가 완료되었습니다." });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/user/me/liked-articles:
 *   get:
 *     tags:
 *       - User
 *     summary: "내가 '좋아요' 한 기사 목록 조회"
 *     description: "현재 로그인한 사용자가 '좋아요'를 누른 모든 기사의 목록을 최신순으로 반환합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: "한 번에 가져올 기사 수"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "건너뛸 기사 수 (페이지네이션용)"
 *     responses:
 *       200:
 *         description: "'좋아요' 한 기사 목록"
 */
router.get("/me/liked-articles", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const limit = parseInt((req.query.limit as string) || "25", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        a.id, a.title, a.url, a.thumbnail_url, a.source, a.source_domain, a.published_at,
        a.view_count,
        COUNT(l2.id) AS like_count
      FROM 
        tn_article_like l1
      JOIN 
        tn_article a ON l1.article_id = a.id
      LEFT JOIN
        tn_article_like l2 ON a.id = l2.article_id
      WHERE 
        l1.user_id = ?
      GROUP BY
        a.id
      ORDER BY 
        l1.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [userId, limit, offset]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching liked articles:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/user/me/inquiries:
 *   get:
 *     tags:
 *       - User
 *     summary: "내 문의 내역 조회"
 *     description: "현재 로그인한 사용자가 작성한 모든 문의와 그에 대한 답변을 최신순으로 조회합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "한 번에 가져올 문의 수"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "건너뛸 문의 수 (페이지네이션용)"
 *     responses:
 *       200:
 *         description: "내 문의 내역 목록"
 */
router.get("/me/inquiries", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const limit = parseInt((req.query.limit as string) || "10", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        i.id, i.subject, i.content, i.file_path, i.status, i.created_at,
        r.content AS reply_content,
        r.created_at AS reply_created_at
      FROM 
        tn_inquiry i
      LEFT JOIN 
        tn_inquiry_reply r ON i.id = r.inquiry_id
      WHERE 
        i.user_id = ?
      ORDER BY 
        i.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [userId, limit, offset]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching user inquiries:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

export default router;
