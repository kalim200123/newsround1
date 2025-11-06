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
      SELECT c.id, c.content, c.created_at, u.nickname, u.profile_image_url
      FROM tn_chat c
      JOIN tn_user u ON c.user_id = u.id
      WHERE c.topic_id = ? AND c.status = 'ACTIVE'
      ORDER BY c.created_at DESC
      LIMIT ?
      OFFSET ?
    `,
      [topicId, limit, offset]
    );

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const messages = (rows as any[]).map(msg => ({
      ...msg,
      profile_image_url: msg.profile_image_url ? `${baseUrl}${msg.profile_image_url}` : null
    }));

    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "채팅 메시지를 불러오는 중 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/topics/{topicId}/chat:
 *   post:
 *     tags:
 *       - Chat
 *     summary: 새 채팅 메시지 작성
 *     description: "로그인한 사용자가 특정 토픽에 대한 새 채팅 메시지를 작성합니다. 작성된 메시지는 DB에 저장되고, 해당 토픽의 모든 클라이언트에게 실시간으로 전송됩니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "메시지를 작성할 토픽의 ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: "메시지 내용 (1000자 이하)"
 *                 example: "안녕하세요!"
 *     responses:
 *       201:
 *         description: "메시지 작성 성공. 작성된 메시지 정보를 반환합니다."
 *       400:
 *         description: "메시지 내용이 비어있거나 너무 김"
 *       401:
 *         description: "인증 실패"
 */
router.post("/", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { topicId } = req.params;
  const userId = req.user?.userId;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ message: "메시지 내용이 비어있습니다." });
  }
  if (content.length > 1000) {
    return res.status(400).json({ message: "메시지는 1000자 이하로 입력해주세요." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert the new message
    const [insertResult]: any = await connection.query(
      "INSERT INTO tn_chat (topic_id, user_id, content) VALUES (?, ?, ?)",
      [topicId, userId, content.trim()]
    );
    const newMessageId = insertResult.insertId;

    // Fetch the newly created message with user info, matching the frontend payload
    const [rows]: any = await connection.query(
        `SELECT c.id, c.content as message, c.created_at, u.nickname as author, u.profile_image_url 
         FROM tn_chat c 
         JOIN tn_user u ON c.user_id = u.id 
         WHERE c.id = ?`,
        [newMessageId]
    );
    const newMessage = rows[0];

    await connection.commit();

    // Emit the new message to the corresponding topic room via Socket.IO
    const io = req.app.get("io");
    if (io && newMessage) {
      io.to(`topic-${topicId}`).emit("receive_message", newMessage);
    }

    // Respond to the POST request
    res.status(201).json(newMessage);

  } catch (error) {
    await connection.rollback();
    console.error("Error posting new message:", error);
    res.status(500).json({ message: "메시지를 전송하는 중 오류가 발생했습니다." });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/chat/{messageId}:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: 내 채팅 메시지 삭제
 *     description: "사용자가 자신이 작성한 메시지를 삭제합니다. (상태를 DELETED로 변경)"
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

  try {
    // 1. Try to log the report first.
    const [logResult]: any = await pool.query(
      "INSERT IGNORE INTO tn_chat_report_log (chat_id, user_id) VALUES (?, ?)",
      [messageId, userId]
    );

    // 2. If affectedRows is 0, it was a duplicate. Stop here.
    if (logResult.affectedRows === 0) {
      return res.status(200).json({ message: "이미 신고한 메시지입니다." });
    }

    // 3. If it's a new report, run the transactional updates.
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query(
        "UPDATE tn_chat SET report_count = report_count + 1 WHERE id = ?",
        [messageId]
      );

      const [messages]: any = await connection.query(
        "SELECT user_id, report_count FROM tn_chat WHERE id = ?",
        [messageId]
      );

      if (messages.length > 0 && messages[0].report_count >= REPORT_THRESHOLD) {
        await connection.query(
          "UPDATE tn_chat SET status = 'HIDDEN' WHERE id = ?",
          [messageId]
        );
        const messageAuthorId = messages[0].user_id;
        await connection.query(
          "UPDATE tn_user SET warning_count = warning_count + 1 WHERE id = ?",
          [messageAuthorId]
        );
      }
      
      await connection.commit();
      res.status(200).json({ message: "신고가 접수되었습니다." });

    } catch (error) {
      await connection.rollback();
      console.error("Error processing report consequences:", error);
      res.status(500).json({ message: "신고를 처리하는 중 오류가 발생했습니다." });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error logging report:", error);
    res.status(500).json({ message: "신고를 기록하는 중 오류가 발생했습니다." });
  }
});

export default router;
