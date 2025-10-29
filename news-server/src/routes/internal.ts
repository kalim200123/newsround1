import express, { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../config/db";

const router = express.Router();

interface UserToNotify extends RowDataPacket {
  id: number;
}

/**
 * @swagger
 * /api/internal/send-notification:
 *   post:
 *     tags: [Internal]
 *     summary: (내부용) 조건부 실시간 알림 발송
 *     description: "내부 시스템(예: Python 스크립트)에서 이 API를 호출하여, 특정 사용자 그룹에게 실시간 알림을 보냅니다."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notification_type, data]
 *             properties:
 *               notification_type:
 *                 type: string
 *                 enum: [NEW_TOPIC, BREAKING_NEWS, EXCLUSIVE_NEWS]
 *               data:
 *                 type: object
 *                 description: "알림에 포함될 데이터 객체"
 *     responses:
 *       202:
 *         description: "알림 발송 작업이 시작됨"
 *       400:
 *         description: "잘못된 요청 데이터"
 */
router.post("/send-notification", async (req: Request, res: Response) => {
  const { notification_type, data } = req.body;

  if (!notification_type || !data) {
    return res.status(400).json({ message: "notification_type and data are required." });
  }

  // 응답을 먼저 보내고, 알림 발송은 백그라운드에서 계속 진행
  res.status(202).json({ message: "Notification dispatch initiated." });

  // --- 백그라운드 알림 발송 로직 ---
  const io = req.app.get('io');
  const userSocketMap = req.app.get('userSocketMap');

  if (!io || !userSocketMap) {
    console.error("Socket.IO is not initialized.");
    return;
  }

  try {
    const [usersToNotify] = await pool.query<UserToNotify[]>(
      `
      SELECT u.id FROM tn_user u
      LEFT JOIN tn_user_notification_settings s 
        ON u.id = s.user_id AND s.notification_type = ?
      WHERE s.is_enabled IS NULL OR s.is_enabled = 1
      `,
      [notification_type]
    );

    const notification = {
      type: notification_type,
      data: data,
    };

    let sentCount = 0;
    for (const user of usersToNotify) {
      const socketId = userSocketMap.get(user.id);
      if (socketId) {
        io.to(socketId).emit('new_notification', notification);
        sentCount++;
      }
    }
    console.log(`[Notification] Sent ${notification_type} notification to ${sentCount} user(s).`);

  } catch (error) {
    console.error(`[Notification] Failed to send notifications for type ${notification_type}:`, error);
  }
});

export default router;
