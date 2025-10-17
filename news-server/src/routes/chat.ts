import express, { Request, Response } from "express";
import pool from "../config/db";
import { authenticateUser, AuthenticatedRequest } from "../middleware/userAuth";

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/topics/{topicId}/chat:
 *   get:
 *     tags:
 *       - Chat
 *     summary: 특정 토픽의 채팅 메시지 목록 조회
 *     description: 특정 토픽 ID에 해당하는 채팅 메시지 목록을 오래된 순으로 조회합니다. 페이지네이션을 지원합니다.
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "메시지를 조회할 토픽의 ID"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: "한 번에 가져올 메시지 수"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "건너뛸 메시지 수 (페이지네이션용)"
 *     responses:
 *       200:
 *         description: 채팅 메시지 목록
 */
router.get("/", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const limit = parseInt(req.query.limit as string || '50', 10);
  const offset = parseInt(req.query.offset as string || '0', 10);

  try {
    const [rows] = await pool.query(
      `
      SELECT c.id, c.content, c.created_at, u.nickname
      FROM tn_chat c
      JOIN tn_user u ON c.user_id = u.id
      WHERE c.topic_id = ? AND c.status = 'ACTIVE'
      ORDER BY c.created_at ASC
      LIMIT ?
      OFFSET ?
    `,
      [topicId, limit, offset]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "채팅 메시지를 불러오는 중 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/chat/{messageId}:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: 내 채팅 메시지 삭제
 *     description: 사용자가 자신이 작성한 메시지를 삭제합니다. (상태를 DELETED로 변경)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "삭제할 메시지의 ID"
 *     responses:
 *       200:
 *         description: 메시지 삭제 성공
 */
router.delete("/:messageId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user?.userId;

  try {
    const [messages]: any = await pool.query(
      "SELECT user_id FROM tn_chat WHERE id = ?",
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({ message: "메시지를 찾을 수 없습니다." });
    }

    if (messages[0].user_id !== userId) {
      return res.status(403).json({ message: "메시지를 삭제할 권한이 없습니다." });
    }

    await pool.query(
      "UPDATE tn_chat SET status = 'DELETED' WHERE id = ?",
      [messageId]
    );

    res.status(200).json({ message: "메시지가 삭제되었습니다." });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "메시지를 삭제하는 중 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/chat/{messageId}/report:
 *   post:
 *     tags:
 *       - Chat
 *     summary: 채팅 메시지 신고
 *     description: 특정 메시지를 신고합니다. 한 사용자는 같은 메시지를 한 번만 신고할 수 있습니다. 누적 신고가 5회 이상이면 해당 메시지는 HIDDEN 상태가 됩니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "신고할 메시지의 ID"
 *     responses:
 *       200:
 *         description: 신고 처리 완료
 */
router.post("/:messageId/report", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user?.userId;
  const REPORT_THRESHOLD = 5;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [logResult]: any = await connection.query(
      "INSERT IGNORE INTO tn_chat_report_log (chat_id, user_id) VALUES (?, ?)",
      [messageId, userId]
    );

    if (logResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(200).json({ message: "이미 신고한 메시지입니다." });
    }

    await connection.query(
      "UPDATE tn_chat SET report_count = report_count + 1 WHERE id = ?",
      [messageId]
    );

    const [messages]: any = await connection.query(
      "SELECT report_count FROM tn_chat WHERE id = ?",
      [messageId]
    );

    if (messages.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "메시지를 찾을 수 없습니다." });
    }

    if (messages[0].report_count >= REPORT_THRESHOLD) {
      await connection.query(
        "UPDATE tn_chat SET status = 'HIDDEN' WHERE id = ?",
        [messageId]
      );
    }

    await connection.commit();
    res.status(200).json({ message: "신고가 접수되었습니다." });

  } catch (error) {
    await connection.rollback();
    console.error("Error reporting message:", error);
    res.status(500).json({ message: "메시지를 신고하는 중 오류가 발생했습니다." });
  } finally {
    connection.release();
  }
});

export default router;