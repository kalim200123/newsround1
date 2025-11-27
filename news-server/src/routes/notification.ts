import express, { Response } from "express";
import pool from "../config/db";
import { AuthenticatedRequest, authenticateUser } from "../middleware/userAuth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: 사용자 알림 관리 API
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: 내 알림 목록 조회
 *     description: 사용자의 알림 목록을 최신순으로 조회합니다.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: 알림 목록 조회 성공
 */
router.get("/", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "20", 10);
  const offset = (page - 1) * limit;

  try {
    const [rows]: any = await pool.query(
      `SELECT id, type, message, related_url, is_read, created_at 
       FROM tn_notification 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countRows]: any = await pool.query("SELECT COUNT(*) as total FROM tn_notification WHERE user_id = ?", [
      userId,
    ]);
    const total = countRows[0].total;

    const [unreadRows]: any = await pool.query(
      "SELECT COUNT(*) as unread_count FROM tn_notification WHERE user_id = ? AND is_read = 0",
      [userId]
    );
    const unreadCount = unreadRows[0].unread_count;

    res.json({
      notifications: rows.map((row: any) => ({
        ...row,
        is_read: Boolean(row.is_read),
      })),
      total,
      unread_count: unreadCount,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: 읽지 않은 알림 개수 조회
 *     description: 헤더 배지용으로 읽지 않은 알림 개수를 반환합니다.
 *     responses:
 *       200:
 *         description: 조회 성공
 */
router.get("/unread-count", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const [rows]: any = await pool.query(
      "SELECT COUNT(*) as unread_count FROM tn_notification WHERE user_id = ? AND is_read = 0",
      [userId]
    );
    res.json({ unread_count: rows[0].unread_count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: 알림 읽음 처리
 *     description: 특정 알림을 읽음 상태로 변경합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 처리 성공
 */
router.post("/:id/read", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const notificationId = req.params.id;

  try {
    const [result]: any = await pool.query("UPDATE tn_notification SET is_read = 1 WHERE id = ? AND user_id = ?", [
      notificationId,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found or already read." });
    }

    res.json({ message: "Notification marked as read.", notification_id: notificationId });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   post:
 *     tags: [Notifications]
 *     summary: 모든 알림 읽음 처리
 *     description: 사용자의 모든 읽지 않은 알림을 읽음 상태로 변경합니다.
 *     responses:
 *       200:
 *         description: 처리 성공
 */
router.post("/read-all", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const [result]: any = await pool.query("UPDATE tn_notification SET is_read = 1 WHERE user_id = ? AND is_read = 0", [
      userId,
    ]);

    res.json({ message: "All notifications marked as read.", updated_count: result.affectedRows });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
