import { Request, Response, Router } from "express";
import pool from "../config/db";
import { AuthenticatedRequest, authenticateUser } from "../middleware/userAuth";
import { FAVICON_URLS } from "../config/favicons";

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
      "SELECT id, display_name, summary, published_at FROM tn_topic WHERE status = 'published' AND topic_type = 'CONTENT' ORDER BY published_at DESC"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topic:
 *                   type: object
 *                 articles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       favicon_url:
 *                         type: string
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

    // Add favicon_url to each article
    const articlesWithFavicon = (articleRows as any[]).map(article => ({
      ...article,
      favicon_url: FAVICON_URLS[article.source_domain] || null
    }));

    const responseData = {
      topic: topicRows[0],
      articles: articlesWithFavicon,
    };
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;