import bcrypt from "bcryptjs";
import express, { Response } from "express";
import path from "path";
import pool from "../config/db";
import { FAVICON_URLS } from "../config/favicons";
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
    const user = users[0];
    if (user.profile_image_url) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      user.profile_image_url = `${baseUrl}${user.profile_image_url}`;
    }
    res.json(user);
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
  const { nickname, introduction } = req.body;
  let { profile_image_url } = req.body;

  if (profile_image_url) {
    try {
      const url = new URL(profile_image_url);
      profile_image_url = url.pathname;
    } catch (error) {
      // Not a full URL, assume it's a relative path
    }
  }

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
  const { currentPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ message: "비밀번호를 입력해주세요." });
  }

  try {
    // 1. Fetch user's hashed password
    const [users]: any = await pool.query("SELECT password FROM tn_user WHERE id = ?", [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const user = users[0];

    // 2. Verify password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // 3. If password is correct, update status to DELETED
    await pool.query("UPDATE tn_user SET status = 'DELETED' WHERE id = ?", [userId]);
    
    res.status(200).json({ message: "회원 탈퇴 처리가 완료되었습니다." });

  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/user/me/notification-settings:
 *   get:
 *     tags:
 *       - User
 *     summary: "내 알림 설정 조회"
 *     description: "현재 로그인한 사용자의 모든 알림 타입에 대한 수신 여부 설정을 반환합니다. 설정한 적 없는 항목은 기본값(true)으로 표시됩니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "알림 설정 목록"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   notification_type:
 *                     type: string
 *                     example: "NEW_TOPIC"
 *                   is_enabled:
 *                     type: boolean
 *                     example: true
 */
router.get("/me/notification-settings", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const NOTIFICATION_TYPES = ['NEW_TOPIC', 'BREAKING_NEWS', 'EXCLUSIVE_NEWS'];

  try {
    const [rows]: any = await pool.query(
      "SELECT notification_type, is_enabled FROM tn_user_notification_settings WHERE user_id = ?",
      [userId]
    );

    const settingsMap = new Map(rows.map((row: { notification_type: string; is_enabled: number }) => [row.notification_type, !!row.is_enabled]));

    const fullSettings = NOTIFICATION_TYPES.map(type => ({
      notification_type: type,
      is_enabled: settingsMap.has(type) ? settingsMap.get(type) : true, // DB에 설정 없으면 기본값 true
    }));

    res.json(fullSettings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/user/me/notification-settings:
 *   put:
 *     tags: 
 *       - User
 *     summary: "내 알림 설정 저장"
 *     description: "현재 로그인한 사용자의 알림 설정을 업데이트합니다. 변경할 설정만 배열에 담아 보냅니다."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required: [notification_type, is_enabled]
 *               properties:
 *                 notification_type:
 *                   type: string
 *                   enum: [NEW_TOPIC, BREAKING_NEWS, EXCLUSIVE_NEWS]
 *                 is_enabled:
 *                   type: boolean
 *     responses:
 *       200:
 *         description: "설정 저장 성공"
 *       400:
 *         description: "요청 데이터 형식 오류"
 */
router.put("/me/notification-settings", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const settings = req.body;

  if (!Array.isArray(settings)) {
    return res.status(400).json({ message: "Request body must be an array of settings." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const query = `
      INSERT INTO tn_user_notification_settings (user_id, notification_type, is_enabled)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)
    `;

    for (const setting of settings) {
      if (typeof setting.notification_type !== 'string' || typeof setting.is_enabled !== 'boolean') {
        throw new Error('Invalid setting format');
      }
      await connection.query(query, [userId, setting.notification_type, setting.is_enabled]);
    }

    await connection.commit();
    res.status(200).json({ message: "Notification settings updated successfully." });

  } catch (error) {
    await connection.rollback();
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/user/me/liked-articles:
 *   get:
 *     tags: [User]
 *     summary: "내가 '좋아요' 누른 기사 목록 조회"
 *     description: "현재 로그인한 사용자가 '좋아요'를 누른 모든 기사 목록을 최신순으로 조회합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: "한 번에 가져올 기사 수"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "건너뛸 기사 수 (페이지네이션용)"
 *     responses:
 *       200:
 *         description: "좋아요 누른 기사 목록"
 */
router.get("/me/liked-articles", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const limit = parseInt(req.query.limit as string || '20', 10);
  const offset = parseInt(req.query.offset as string || '0', 10);

  try {
    // Query for the paginated list of articles
    const articlesQuery = pool.query(`
      SELECT
        a.*,
        (SELECT COUNT(*) FROM tn_article_like WHERE article_id = a.id) as like_count
      FROM
        tn_article_like ul
      JOIN
        tn_article a ON ul.article_id = a.id
      WHERE
        ul.user_id = ?
      ORDER BY
        ul.created_at DESC
      LIMIT ? OFFSET ?;
    `, [userId, limit, offset]);

    // Query for the total count of liked articles
    const countQuery = pool.query("SELECT COUNT(*) as totalCount FROM tn_article_like WHERE user_id = ?", [userId]);

    const [
      [articleRows],
      [countResult]
    ] = await Promise.all([articlesQuery, countQuery]);
    
    const articlesWithFavicon = (articleRows as any[]).map(article => ({
      ...article,
      isLiked: true, // 이 API는 좋아요 누른 기사만 반환하므로 항상 true
      favicon_url: FAVICON_URLS[article.source_domain] || null,
    }));

    res.json({
      articles: articlesWithFavicon,
      totalCount: (countResult as any)[0].totalCount
    });
  } catch (error) {
    console.error("Error fetching liked articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;