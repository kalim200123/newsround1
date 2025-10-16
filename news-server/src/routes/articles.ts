import { Router, Request, Response } from "express";
import pool from "../config/db";
import { authenticateUser, AuthenticatedRequest } from "../middleware/userAuth";
import { FAVICON_URLS } from "../config/favicons";

const router = Router();

// Helper function to add favicon url to articles
const addFaviconUrl = (article: any) => ({
  ...article,
  favicon_url: FAVICON_URLS[article.source_domain] || null,
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ArticleWithFavicon:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         source:
 *           type: string
 *         source_domain:
 *           type: string
 *         title:
 *           type: string
 *         url:
 *           type: string
 *         published_at:
 *           type: string
 *           format: date-time
 *         thumbnail_url:
 *           type: string
 *         favicon_url:
 *           type: string
 */

/**
 * @swagger
 * /api/articles/by-category:
 *   get:
 *     tags:
 *       - Articles
 *     summary: 카테고리별 최신 기사 목록 조회
 *     description: 특정 카테고리에 해당하는 기사 목록을 최신순으로 조회합니다.
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: "필터링할 카테고리 이름 (예: 정치, 경제)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: "한 번에 가져올 기사 수"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "건너뛸 기사 수 (페이지네이션용)"
 *     responses:
 *       200:
 *         description: 해당 카테고리의 기사 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ArticleWithFavicon'
 */
router.get("/by-category", async (req: Request, res: Response) => {
  const { name, limit = 30, offset = 0 } = req.query;

  if (!name) {
    return res.status(400).json({ message: "카테고리 이름을 'name' 파라미터로 제공해야 합니다." });
  }

  try {
    const query = "SELECT id, source, source_domain, title, url, published_at, thumbnail_url FROM tn_home_article WHERE category = ? ORDER BY published_at DESC LIMIT ? OFFSET ?";
    const [rows] = await pool.query(query, [name, Number(limit), Number(offset)]);
    const articlesWithFavicon = (rows as any[]).map(addFaviconUrl);
    res.json(articlesWithFavicon);
  } catch (error) {
    console.error("Error fetching articles by category:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/articles/by-source:
 *   get:
 *     tags:
 *       - Articles
 *     summary: 언론사별 최신 기사 목록 조회
 *     description: 특정 언론사에 해당하는 기사 목록을 최신순으로 조회합니다.
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: "필터링할 언론사 이름 (예: 경향신문, 조선일보)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: "한 번에 가져올 기사 수"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "건너뛸 기사 수 (페이지네이션용)"
 *     responses:
 *       200:
 *         description: 해당 언론사의 기사 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ArticleWithFavicon'
 */
router.get("/by-source", async (req: Request, res: Response) => {
  const { name, limit = 30, offset = 0 } = req.query;

  if (!name) {
    return res.status(400).json({ message: "언론사 이름을 'name' 파라미터로 제공해야 합니다." });
  }

  try {
    const query = "SELECT id, source, source_domain, title, url, published_at, thumbnail_url FROM tn_home_article WHERE source = ? ORDER BY published_at DESC LIMIT ? OFFSET ?";
    const [rows] = await pool.query(query, [name, Number(limit), Number(offset)]);
    const articlesWithFavicon = (rows as any[]).map(addFaviconUrl);
    res.json(articlesWithFavicon);
  } catch (error) {
    console.error("Error fetching articles by source:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/articles/popular:
 *   get:
 *     tags:
 *       - Articles
 *     summary: 인기 기사 목록 조회
 *     description: 최근 3일간의 기사들을 대상으로, 조회수(1점)와 추천수(3점)를 합산한 인기 점수가 높은 순으로 목록을 조회합니다.
 *     responses:
 *       200:
 *         description: 인기 기사 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/ArticleWithFavicon'
 *                   - type: object
 *                     properties:
 *                       popularity_score:
 *                         type: number
 */
router.get("/popular", async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        a.id, a.source, a.source_domain, a.title, a.url, a.published_at, a.thumbnail_url,
        (a.view_count + (COUNT(l.id) * 3)) AS popularity_score
      FROM 
        tn_home_article a
      LEFT JOIN 
        tn_article_like l ON a.id = l.article_id
      WHERE 
        a.published_at >= NOW() - INTERVAL 3 DAY
      GROUP BY 
        a.id
      ORDER BY 
        popularity_score DESC
      LIMIT 30;
    `;
    const [rows] = await pool.query(query);
    const articlesWithFavicon = (rows as any[]).map(addFaviconUrl);
    res.json(articlesWithFavicon);
  } catch (error) {
    console.error("Error fetching popular articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/articles/{articleId}/like:
 *   post:
 *     tags:
 *       - Articles
 *     summary: 기사 추천 또는 추천 취소 (토글)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 추천 취소 성공
 *       201:
 *         description: 추천 성공
 */
router.post("/:articleId/like", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const articleId = req.params.articleId;
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required." });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [deleteResult]: any = await connection.query(
      "DELETE FROM tn_article_like WHERE user_id = ? AND article_id = ?",
      [userId, articleId]
    );
    if (deleteResult.affectedRows > 0) {
      await connection.commit();
      res.status(200).json({ message: "Like removed." });
    } else {
      await connection.query(
        "INSERT INTO tn_article_like (user_id, article_id) VALUES (?, ?)",
        [userId, articleId]
      );
      await connection.commit();
      res.status(201).json({ message: "Like added." });
    }
  } catch (error) {
    await connection.rollback();
    console.error("Error handling article like:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/articles/{articleId}/view:
 *   post:
 *     tags:
 *       - Articles
 *     summary: 기사 조회수 1 증가
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 조회수 증가 성공
 */
router.post("/:articleId/view", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  try {
    const [result]: any = await pool.query(
      "UPDATE tn_home_article SET view_count = view_count + 1 WHERE id = ?",
      [articleId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Article not found." });
    }
    res.status(200).json({ message: `View count for article ${articleId} incremented.` });
  } catch (error) {
    console.error(`Error incrementing view count for article ${articleId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/articles/exclusives:
 *   get:
 *     tags:
 *       - Articles
 *     summary: "[단독] 기사 목록 조회"
 *     description: "제목에 '[단독]'이 포함된 기사 목록을 최신순으로 조회합니다."
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: "한 번에 가져올 기사 수"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "건너뛸 기사 수 (페이지네이션용)"
 *     responses:
 *       200:
 *         description: "[단독] 기사 목록"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ArticleWithFavicon'
 */
router.get("/exclusives", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string || '30', 10);
  const offset = parseInt(req.query.offset as string || '0', 10);

  try {
    const query = "SELECT id, source, source_domain, url, published_at, title, thumbnail_url FROM tn_home_article WHERE title LIKE '%[단독]%' ORDER BY published_at DESC LIMIT ? OFFSET ?";
    const [rows] = await pool.query(query, [limit, offset]);
    const articlesWithFavicon = (rows as any[]).map(addFaviconUrl);
    res.json(articlesWithFavicon);
  } catch (error) {
    console.error("Error fetching exclusive articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/articles/breaking:
 *   get:
 *     tags:
 *       - Articles
 *     summary: "[속보] 기사 목록 조회"
 *     description: "제목에 '[속보]'가 포함된 기사 목록을 최신순으로 조회합니다."
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: "한 번에 가져올 기사 수"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "건너뛸 기사 수 (페이지네이션용)"
 *     responses:
 *       200:
 *         description: "[속보] 기사 목록"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ArticleWithFavicon'
 */
router.get("/breaking", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string || '30', 10);
  const offset = parseInt(req.query.offset as string || '0', 10);

  try {
    const query = "SELECT id, source, source_domain, url, published_at, title, thumbnail_url FROM tn_home_article WHERE title LIKE '%[속보]%' ORDER BY published_at DESC LIMIT ? OFFSET ?";
    const [rows] = await pool.query(query, [limit, offset]);
    const articlesWithFavicon = (rows as any[]).map(addFaviconUrl);
    res.json(articlesWithFavicon);
  } catch (error) {
    console.error("Error fetching breaking articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
