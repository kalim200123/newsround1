import express, { Request, Response } from "express";
import pool from "../config/db";
import { FAVICON_URLS } from "../config/favicons";
import { AuthenticatedRequest, authenticateUser, optionalAuthenticateUser } from "../middleware/userAuth";

const router = express.Router();

// Helper function to process articles, adding favicon
const processArticles = (articles: any[]) => {
  return articles.map((article) => ({
    ...article,
    favicon_url: FAVICON_URLS[article.source_domain] || null,
  }));
};

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
 *     summary: "카테고리별 최신 기사 목록 조회 (언론사 필터링 지원)"
 *     description: "특정 카테고리의 최신 기사를 조회합니다. `sources` 파라미터 유무에 따라 두 가지 방식으로 동작합니다."
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: "필터링할 카테고리 이름 (예: 정치, 경제)"
 *       - in: query
 *         name: sources
 *         schema:
 *           type: string
 *         description: "필터링할 언론사 이름 1개. 이 값을 제공하면 해당 언론사의 기사 10개만 반환됩니다. 제공하지 않으면 모든 언론사의 기사를 합쳐 60개 반환됩니다."
 *     responses:
 *       200:
 *         description: "기사 목록"
 */
router.get("/by-category", optionalAuthenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { name, sources } = req.query;

  if (!name) {
    return res.status(400).json({ message: "카테고리 이름을 'name' 파라미터로 제공해야 합니다." });
  }

  try {
    let query: string;
    let params: (string | number | null)[];

    const sourceList = typeof sources === 'string' && sources ? sources.split(',') : [];

    if (sourceList.length > 0) {
      // New logic: Fetch 10 articles per specified source
      const perSourceLimit = 10;
      const subQueries = sourceList.map(() => `
        (SELECT a.*
         FROM tn_home_article a
         WHERE a.category = ? AND a.source = ? AND a.published_at >= NOW() - INTERVAL 3 DAY
         ORDER BY a.published_at DESC
         LIMIT ?)
      `);
      query = subQueries.join(' UNION ALL ');
      
      params = [];
      sourceList.forEach(source => {
        params.push(name as string, source, perSourceLimit);
      });

    } else {
      // Fallback logic: Fetch latest 60 for the category if no sources are specified
      const limit = 60;
      query = `
        SELECT a.*
        FROM tn_home_article a
        WHERE a.category = ? AND a.published_at >= NOW() - INTERVAL 3 DAY
        ORDER BY a.published_at DESC
        LIMIT ?
      `;
      params = [name as string, limit];
    }

    const [rows] = await pool.query(query, params);
    res.json(processArticles(rows as any[]));

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
 *     summary: "언론사별 최신 기사 목록 조회"
 *     description: "특정 언론사에 해당하는 기사 목록을 최신순으로 조회합니다."
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
 *         description: "해당 언론사의 기사 목록"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ArticleWithFavicon'
 */
router.get("/by-source", optionalAuthenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const name = req.query.name as string;
  const limit = parseInt(req.query.limit as string || '30', 10);
  const offset = parseInt(req.query.offset as string || '0', 10);

  if (!name) {
    return res.status(400).json({ message: "언론사 이름을 'name' 파라미터로 제공해야 합니다." });
  }

  try {
    const query = `
      SELECT a.*
      FROM tn_home_article a
      WHERE a.source = ?
      ORDER BY a.published_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [name, limit, offset]);
    res.json(processArticles(rows as any[]));
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
 *     summary: "인기 기사 목록 조회"
 *     description: "최근 3일간의 기사들을 대상으로, 조회수가 높은 순으로 10개의 목록을 조회합니다. 카테고리별 조회를 지원합니다."
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: "조회할 카테고리 (미지정 시 전체 카테고리 대상)"
 *     responses:
 *       200:
 *         description: "인기 기사 목록"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ArticleWithFavicon'
 */
router.get("/popular", optionalAuthenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { category } = req.query;

  try {
    let query = `
      SELECT a.*
      FROM tn_home_article a
      WHERE a.published_at >= NOW() - INTERVAL 3 DAY
    `;

    const params: (string | number | undefined)[] = [];
    if (category) {
      query += ` AND a.category = ?`;
      params.push(category as string);
    }

    query += `
      ORDER BY a.view_count DESC, a.published_at DESC
      LIMIT 10;
    `;

    const [rows] = await pool.query(query, params);
    res.json(processArticles(rows as any[]));
  } catch (error) {
    console.error("Error fetching popular articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * @swagger
 * /api/articles/{articleId}/view:
 *   post:
 *     tags:
 *       - Articles
 *     summary: "기사 조회수 1 증가"
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "조회수 증가 성공"
 */
router.post("/:articleId/view", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  try {
    // This endpoint now simply increments the view count on the tn_article table.
    // The old logic for preventing duplicate views with tn_article_view_log has been removed for simplicity.
    const [updateResult]: any = await pool.query(
      "UPDATE tn_article SET view_count = view_count + 1 WHERE id = ?",
      [articleId]
    );

    if (updateResult.affectedRows === 0) {
      // Also try updating tn_home_article as a fallback
      const [updateHomeResult]: any = await pool.query(
        "UPDATE tn_home_article SET view_count = view_count + 1 WHERE id = ?",
        [articleId]
      );
      if (updateHomeResult.affectedRows === 0) {
        return res.status(404).json({ message: "Article not found in any table." });
      }
    }

    res.status(200).json({ message: "View count incremented." });
  } catch (error) {
    console.error(`Error incrementing view count for article ${articleId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/articles/{articleId}/save:
 *   post:
 *     tags:
 *       - Saved Articles
 *     summary: 기사 저장
 *     description: |
 *       로그인한 사용자가 특정 기사를 내 마이페이지에 저장합니다.
 *       - **DB Schema:** `tn_user_saved_articles`
 *       - `id`: (PK) 저장된 기사 고유 ID
 *       - `user_id`: (FK) 사용자 ID
 *       - `article_id`: (FK) 기사 ID
 *       - `category_id`: (FK, nullable) 사용자가 지정한 카테고리 ID
 *       - `created_at`: 저장한 시각
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: "기사 저장 성공. 생성된 savedArticleId를 포함한 정보를 반환합니다."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Article saved successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     savedArticleId:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     articleId:
 *                       type: integer
 *       404:
 *         description: "기사를 찾을 수 없음"
 *       409:
 *         description: "이미 저장된 기사"
 */
router.post("/:articleId/save", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const articleId = req.params.articleId;
  const userId = req.user?.userId;

  const connection = await pool.getConnection();
  try {
    // 1. 기사 존재 여부 확인
    const [articleRows]: any = await connection.query("SELECT id FROM tn_article WHERE id = ?", [articleId]);
    if (articleRows.length === 0) {
      return res.status(404).json({ message: "Article not found." });
    }

    // 2. 기사 저장 (INSERT IGNORE로 중복 방지)
    const [result]: any = await connection.query(
      "INSERT IGNORE INTO tn_user_saved_articles (user_id, article_id) VALUES (?, ?)",
      [userId, articleId]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ message: "Article already saved." });
    }

    // 3. 생성된 데이터 정보와 함께 201 응답 반환
    res.status(201).json({
      message: "Article saved successfully.",
      data: {
        savedArticleId: result.insertId,
        userId,
        articleId: parseInt(articleId, 10),
      },
    });
  } catch (error) {
    console.error("Error saving article:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/articles/{articleId}/save:
 *   delete:
 *     tags:
 *       - Saved Articles
 *     summary: 기사 저장 취소
 *     description: |
 *       로그인한 사용자가 마이페이지에 저장했던 기사를 삭제합니다.
 *       - **DB Schema:** `tn_user_saved_articles`
 *       - `id`: (PK) 저장된 기사 고유 ID
 *       - `user_id`: (FK) 사용자 ID
 *       - `article_id`: (FK) 기사 ID
 *       - `category_id`: (FK, nullable) 사용자가 지정한 카테고리 ID
 *       - `created_at`: 저장한 시각
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
 *         description: "기사 저장 취소 성공"
 *       404:
 *         description: "저장된 기사를 찾을 수 없음"
 */
router.delete("/:articleId/save", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const articleId = req.params.articleId;
  const userId = req.user?.userId;

  try {
    const [result]: any = await pool.query("DELETE FROM tn_user_saved_articles WHERE user_id = ? AND article_id = ?", [
      userId,
      articleId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Saved article not found." });
    }

    res.status(200).json({ message: "Article unsaved successfully." });
  } catch (error) {
    console.error("Error unsaving article:", error);
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
router.get("/exclusives", optionalAuthenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt((req.query.limit as string) || "30", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);

  try {
    const query = `
      SELECT a.*
      FROM tn_home_article a
      WHERE a.title LIKE '%[단독]%'
      ORDER BY a.published_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [limit, offset]);
    res.json(processArticles(rows as any[]));
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
router.get("/breaking", optionalAuthenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt((req.query.limit as string) || "30", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);

  try {
    const query = `
      SELECT a.*
      FROM tn_home_article a
      WHERE a.title LIKE '%[속보]%'
      ORDER BY a.published_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [limit, offset]);
    res.json(processArticles(rows as any[]));
  } catch (error) {
    console.error("Error fetching breaking articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
