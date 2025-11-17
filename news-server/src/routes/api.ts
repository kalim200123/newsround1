import { Request, Response, Router } from "express";
import fs from "fs";
import path from "path";
import pool from "../config/db";
import { FAVICON_URLS } from "../config/favicons";
import { AuthenticatedRequest, optionalAuthenticateUser } from "../middleware/userAuth";

const router = Router();

/**
 * @swagger
 * /api/avatars:
 *   get:
 *     tags: [User]
 *     summary: 선택 가능한 프로필 아바타 목록 조회
 *     description: "사용자가 프로필 사진으로 선택할 수 있는 모든 아바타 이미지의 URL 목록을 반환합니다."
 *     responses:
 *       200:
 *         description: "아바타 이미지 URL 배열"
 */
router.get("/avatars", (req: Request, res: Response) => {
  const avatarDir = path.join(__dirname, "../../public/avatars");
  try {
    const files = fs.readdirSync(avatarDir);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const avatarUrls = files.map((file) => `${baseUrl}/public/avatars/${file}`);
    res.json(avatarUrls);
  } catch (error) {
    console.error("Error reading avatars directory:", error);
    res.status(500).json({ message: "아바타 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/topics:
 *   get:
 *     tags: [Topics]
 *     summary: 모든 발행된 토픽을 최신순으로 조회
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
      "SELECT id, display_name, summary, published_at, view_count FROM tn_topic WHERE status = 'published' AND topic_type = 'CONTENT' ORDER BY published_at DESC"
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
 * /api/topics/popular-ranking:
 *   get:
 *     tags: [Topics]
 *     summary: 인기 토픽 10개 조회
 *     description: "주기적으로 계산된 인기 점수(popularity_score)를 기준으로 상위 10개의 토픽 목록을 반환합니다."
 *     responses:
 *       200:
 *         description: "인기 토픽 목록"
 */
router.get("/topics/popular-ranking", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, display_name, summary, published_at, view_count, popularity_score 
       FROM tn_topic 
       WHERE status = 'published' AND topic_type = 'CONTENT'
       ORDER BY popularity_score DESC, published_at DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching popular topics ranking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/topics/latest:
 *   get:
 *     tags: [Topics]
 *     summary: 최신 토픽 10개 조회
 *     description: "가장 최근에 발행된 토픽 10개의 목록을 반환합니다."
 *     responses:
 *       200:
 *         description: "최신 토픽 10개 목록"
 */
router.get("/topics/latest", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, display_name, summary, published_at, view_count, popularity_score 
       FROM tn_topic 
       WHERE status = 'published' AND topic_type = 'CONTENT'
       ORDER BY published_at DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching latest topics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/topics/popular-all:
 *   get:
 *     tags: [Topics]
 *     summary: 모든 발행된 토픽을 인기순으로 조회
 *     description: "홈페이지 등에서 사용하기 위해, 모든 발행된 토픽을 popularity_score가 높은 순으로 정렬하여 반환합니다."
 *     responses:
 *       200:
 *         description: 인기순으로 정렬된 모든 토픽 목록
 */
router.get("/topics/popular-all", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, display_name, summary, published_at, view_count, popularity_score 
       FROM tn_topic 
       WHERE status = 'published' AND topic_type = 'CONTENT'
       ORDER BY popularity_score DESC, published_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching all popular topics:", error);
    res.status(500).json({ message: "Server error" });
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
 *     security:
 *       - bearerAuth: [] # 이 API가 인증 토큰을 사용할 수 있음을 명시
 *     responses:
 *       200:
 *         description: 토픽 정보와 관련 기사 목록을 반환했습니다.
 */
router.get("/topics/:topicId", optionalAuthenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { topicId } = req.params;
  const userId = req.user?.userId; // From optionalAuthenticateUser

  try {
    const [topicRows]: any = await pool.query(
      "SELECT id, display_name, summary, published_at, view_count, collection_status FROM tn_topic WHERE id = ? AND status = 'published'",
      [topicId]
    );
    if (topicRows.length === 0) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const [articleRows] = await pool.query(
      `
      SELECT 
        a.id, a.source, a.source_domain, a.side, a.title, a.url, a.published_at, a.is_featured, a.thumbnail_url, a.view_count,
        COUNT(l_total.id) AS like_count,
        MAX(IF(l_user.id IS NOT NULL, 1, 0)) AS isLiked,
        MAX(IF(s_user.id IS NOT NULL, 1, 0)) AS isSaved
      FROM 
        tn_article a
      LEFT JOIN 
        tn_article_like l_total ON a.id = l_total.article_id
      LEFT JOIN
        tn_article_like l_user ON a.id = l_user.article_id AND l_user.user_id = ?
      LEFT JOIN
        tn_user_saved_articles s_user ON a.id = s_user.article_id AND s_user.user_id = ?
      WHERE 
        a.topic_id = ? AND a.status = 'published'
      GROUP BY
        a.id
      ORDER BY 
        a.display_order ASC, a.published_at DESC
      `,
      [userId, userId, topicId] // userId is used twice now
    );

    const articlesWithFavicon = (articleRows as any[]).map((article) => ({
      ...article,
      isLiked: Boolean(article.isLiked), // Convert 0/1 to false/true
      isSaved: Boolean(article.isSaved),
      favicon_url: FAVICON_URLS[article.source_domain] || null,
    }));

    const responseData = {
      topic: topicRows[0],
      articles: articlesWithFavicon,
    };
    res.json(responseData);
  } catch (error) {
    console.error("Error fetching topic details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/topics/{topicId}/view:
 *   post:
 *     tags: [Topics]
 *     summary: 토픽 조회수 1 증가
 *     description: "특정 토픽의 조회수를 1 증가시킵니다. 24시간 내 동일 사용자의 중복 조회는 카운트되지 않습니다."
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: "integer" }
 *         description: "조회수를 증가시킬 토픽의 ID"
 *     responses:
 *       200:
 *         description: "조회수 증가 처리 완료 (중복 포함)"
 */
router.post("/topics/:topicId/view", optionalAuthenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { topicId } = req.params;
  const userId = req.user?.userId;
  const ip = req.ip;
  const userIdentifier = userId ? `user_${userId}` : `ip_${ip}`;
  const cooldownHours = 24;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [recentViews]: any = await connection.query(
      `SELECT id FROM tn_topic_view_log 
       WHERE topic_id = ? AND user_identifier = ? AND created_at >= NOW() - INTERVAL ? HOUR`,
      [topicId, userIdentifier, cooldownHours]
    );

    if (recentViews.length > 0) {
      await connection.rollback();
      return res.status(200).json({ message: "View already counted within the cooldown period." });
    }

    await connection.query("INSERT INTO tn_topic_view_log (topic_id, user_identifier) VALUES (?, ?)", [
      topicId,
      userIdentifier,
    ]);

    const [updateResult]: any = await connection.query("UPDATE tn_topic SET view_count = view_count + 1 WHERE id = ?", [
      topicId,
    ]);

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Topic not found." });
    }

    await connection.commit();
    res.status(200).json({ message: "Topic view count incremented." });
  } catch (error) {
    await connection.rollback();
    console.error(`Error incrementing topic view count for topic ${topicId}:`, error);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags: [Articles]
 *     summary: 기사 검색 (AI 시맨틱 검색)
 *     description: "검색어(q)를 받아, AI 모델을 통해 의미적으로 가장 유사한 기사를 검색합니다."
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: "검색할 키워드"
 *     responses:
 *       200:
 *         description: "검색 결과 목록"
 */
router.get("/search", optionalAuthenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const query = req.query.q as string;
  const userId = req.user?.userId;

  if (!query || query.trim() === "") {
    return res.status(400).json({ message: "검색어를 입력해주세요." });
  }

  const searchQuery = `%${query}%`;

  try {
    const [rows] = await pool.query(
      `SELECT a.*, COUNT(l.id) AS like_count, MAX(IF(l_user.id IS NOT NULL, 1, 0)) as isLiked
       FROM tn_home_article a
       LEFT JOIN tn_article_like l ON a.id = l.article_id
       LEFT JOIN tn_article_like l_user ON a.id = l_user.article_id AND l_user.user_id = ?
       WHERE (a.title LIKE ? OR a.description LIKE ?)
       GROUP BY a.id
       ORDER BY a.published_at DESC
       LIMIT 50`,
      [userId, searchQuery, searchQuery]
    );
    const articlesWithFavicon = (rows as any[]).map((article) => ({
      ...article,
      isLiked: Boolean(article.isLiked),
      favicon_url: FAVICON_URLS[article.source_domain] || null,
    }));
    res.json(articlesWithFavicon);
  } catch (error) {
    console.error("Error searching articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
