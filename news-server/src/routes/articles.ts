import { Router, Request, Response } from "express";
import pool from "../config/db";
import { authenticateUser, AuthenticatedRequest } from "../middleware/userAuth";

const router = Router();

/**
 * @swagger
 * /api/articles:
 *   get:
 *     tags:
 *       - Articles
 *     summary: 최신 기사 목록 조회 (필터링 가능)
 *     description: DB에 저장된 최신 기사 목록을 조회합니다. `category` 또는 `source` 파라미터로 필터링할 수 있습니다.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: "필터링할 카테고리 (예: 정치, 경제)"
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: "필터링할 언론사 (예: 경향신문, 조선일보)"
 *     responses:
 *       200:
 *         description: 기사 목록
 */
router.get("/", async (req: Request, res: Response) => {
  const { category, source } = req.query;

  try {
    let query = "SELECT * FROM tn_home_article";
    const params: string[] = [];

    if (category) {
      query += " WHERE category = ?";
      params.push(category as string);
    } else if (source) {
      query += " WHERE source = ?";
      params.push(source as string);
    }

    query += " ORDER BY COALESCE(published_at, created_at) DESC LIMIT 30";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching latest articles:", error);
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
 */
router.get("/popular", async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        a.*,
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
    res.json(rows);
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

export default router;
