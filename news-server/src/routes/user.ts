import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../config/db";
import { authenticateUser, AuthenticatedRequest } from "../middleware/userAuth";

const router = express.Router();

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     tags:
 *       - User
 *     summary: 내 정보 조회
 *     description: 현재 로그인된 사용자의 프로필 정보를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 프로필 정보
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
 *         description: 인증 실패
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/me", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const [users]: any = await pool.query(
      "SELECT email, name, nickname, phone FROM tn_user WHERE id = ? AND status = 'ACTIVE'",
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
 *   delete:
 *     tags:
 *       - User
 *     summary: 회원 탈퇴
 *     description: 현재 로그인된 사용자의 계정을 비활성화(탈퇴) 처리합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 회원 탈퇴 성공
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
import { validateUpdateUser } from "../middleware/updateUserValidation";

router.delete("/me", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    await pool.query(
      "UPDATE tn_user SET status = 'DELETED' WHERE id = ?",
      [userId]
    );
    res.status(200).json({ message: "회원 탈퇴 처리가 완료되었습니다." });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/user/me:
 *   put:
 *     tags:
 *       - User
 *     summary: 내 정보 수정
 *     description: 현재 로그인된 사용자의 프로필 정보(닉네임, 휴대폰 번호)를 수정합니다.
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
 *               phone:
 *                 type: string
 *                 description: "새로운 휴대폰 번호"
 *     responses:
 *       200:
 *         description: 정보 수정 성공
 *       400:
 *         description: 유효성 검사 실패
 *       401:
 *         description: 인증 실패
 *       409:
 *         description: 닉네임 또는 휴대폰 번호 중복
 *       500:
 *         description: 서버 오류
 */
import { validateChangePassword } from "../middleware/changePasswordValidation";

router.put("/me", authenticateUser, validateUpdateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { nickname, phone } = req.body;

  if (!nickname && !phone) {
    return res.status(400).json({ message: "수정할 정보를 입력해주세요." });
  }

  try {
    // 중복 확인
    if (nickname) {
      const [existingUsers]: any = await pool.query(
        "SELECT id FROM tn_user WHERE nickname = ? AND id != ?",
        [nickname, userId]
      );
      if (existingUsers.length > 0) {
        return res.status(409).json({ field: 'nickname', message: "이미 사용 중인 닉네임입니다." });
      }
    }
    if (phone) {
      const [existingUsers]: any = await pool.query(
        "SELECT id FROM tn_user WHERE phone = ? AND id != ?",
        [phone, userId]
      );
      if (existingUsers.length > 0) {
        return res.status(409).json({ field: 'phone', message: "이미 등록된 휴대폰 번호입니다." });
      }
    }

    // 정보 업데이트
    const fieldsToUpdate = [];
    const params = [];
    if (nickname) {
      fieldsToUpdate.push("nickname = ?");
      params.push(nickname);
    }
    if (phone) {
      fieldsToUpdate.push("phone = ?");
      params.push(phone);
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
 *     summary: 비밀번호 변경
 *     description: 현재 로그인된 사용자의 비밀번호를 변경합니다.
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
 *                 description: "현재 사용중인 비밀번호"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: "새로운 비밀번호"
 *               newPassword_confirmation:
 *                 type: string
 *                 format: password
 *                 description: "새로운 비밀번호 확인"
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
 *       400:
 *         description: 유효성 검사 실패
 *       401:
 *         description: 현재 비밀번호가 일치하지 않음
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.put("/me/password", authenticateUser, validateChangePassword, async (req: AuthenticatedRequest, res: Response) => {
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
      return res.status(401).json({ field: 'currentPassword', message: "현재 비밀번호가 일치하지 않습니다." });
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      "UPDATE tn_user SET password = ? WHERE id = ?",
      [newPasswordHash, userId]
    );

    res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });

  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

export default router;