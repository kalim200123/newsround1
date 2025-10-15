import { Request, Response, Router } from "express";
import pool from "../config/db";
import { AuthenticatedRequest, authenticateUser } from "../middleware/userAuth";

const router = Router();

/**
 * @swagger
 * /api/topics:
 *   get:
 *     tags: [Topics]
 *     summary: 발행된 토픽 목록 조회
 *     description: 사용자에게 노출되는 발행 상태의 토픽 목록을 최신순으로 반환합니다.
 *     responses:
 *       200:
 *         description: 성공적으로 토픽 목록을 반환했습니다.
 */
router.get("/topics", async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT id, display_name, summary, published_at FROM tn_topic WHERE status = 'published' ORDER BY published_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * @swagger
 * /api/topics/{topicId}:
 *   get:
 *     tags: [Topics]
 *     summary: 특정 토픽 상세 및 관련 기사 조회
 *     description: 선택한 토픽 정보와 좌·우 기사 목록을 함께 반환합니다.
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: "integer" }
 *         description: 조회할 토픽의 고유 ID
 *     responses:
 *       200:
 *         description: 토픽 정보와 관련 기사 목록을 반환했습니다.
 *       404:
 *         description: 해당 토픽을 찾을 수 없습니다.
 */
router.get("/topics/:topicId", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    const [topicRows]: any = await pool.query(
      "SELECT id, display_name, summary, published_at FROM tn_topic WHERE id = ? AND status = 'published'",
      [topicId]
    );
    if (topicRows.length === 0) {
      return res.status(404).json({ message: "Topic not found" });
    }
    const [articleRows] = await pool.query(
      "SELECT id, source, source_domain, side, title, url, published_at, is_featured, thumbnail_url FROM tn_article WHERE topic_id = ? AND status = 'published' ORDER BY `display_order` ASC",
      [topicId]
    );
    const responseData = {
      topic: topicRows[0],
      articles: articleRows,
    };
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/topics/{topicId}/comments:
 *   get:
 *     tags: [Topics]
 *     summary: 토픽 댓글 목록 조회
 *     description: 최근 작성된 순서대로 댓글 목록을 반환합니다.
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: "integer" }
 *         description: 댓글을 조회할 토픽의 고유 ID
 *     responses:
 *       200:
 *         description: 댓글 목록을 반환했습니다.
 */
router.get("/topics/:topicId/comments", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    const [comments]: any = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.nickname 
       FROM tn_comment c
       JOIN tn_user u ON c.user_id = u.id
       WHERE c.topic_id = ? 
       ORDER BY c.created_at DESC`,
      [topicId]
    );
    res.json(comments);
  } catch (error) {
    console.error(`Error fetching comments for topic ${topicId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/topics/{topicId}/comments:
 *   post:
 *     tags: [Topics]
 *     summary: 토픽 댓글 작성
 *     description: 인증된 사용자가 새로운 댓글을 작성합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: "integer" }
 *         description: 댓글을 작성할 토픽의 고유 ID
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
 *                 example: "흥미로운 관점이네요!"
 *     responses:
 *       201:
 *         description: 댓글이 성공적으로 등록되었습니다.
 *       401:
 *         description: 인증 토큰이 필요합니다.
 */
router.post("/topics/:topicId/comments", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { topicId } = req.params;
  const { content } = req.body;
  const userId = req.user?.userId;

  if (!content) {
    return res.status(400).json({ message: "Comment content is required." });
  }

  try {
    const [result]: any = await pool.query("INSERT INTO tn_comment (topic_id, user_id, content) VALUES (?, ?, ?)", [
      topicId,
      userId,
      content,
    ]);

    const [newComment]: any = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.nickname 
       FROM tn_comment c
       JOIN tn_user u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error(`Error posting comment for topic ${topicId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;