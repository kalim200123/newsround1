import express, { Request, Response } from "express";
import pool from "../config/db";
import { FAVICON_URLS } from "../config/favicons";
import { AuthenticatedRequest, authenticateUser, optionalAuthenticateUser } from "../middleware/userAuth";

const router = express.Router();

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
 *     summary: "카테고리별 최신 기사 목록 조회"
 *     description: "특정 카테고리에 해당하는 기사 목록을 최신순으로 조회합니다."
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
 *         description: "해당 카테고리의 기사 목록"
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
    const query =
      "SELECT id, source, source_domain, title, url, published_at, thumbnail_url FROM tn_home_article WHERE category = ? ORDER BY published_at DESC LIMIT ? OFFSET ?";
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
router.get("/by-source", async (req: Request, res: Response) => {
  const { name, limit = 30, offset = 0 } = req.query;

  if (!name) {
    return res.status(400).json({ message: "언론사 이름을 'name' 파라미터로 제공해야 합니다." });
  }

  try {
    const query =
      "SELECT id, source, source_domain, title, url, published_at, thumbnail_url FROM tn_home_article WHERE source = ? ORDER BY published_at DESC LIMIT ? OFFSET ?";
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
 *     summary: "인기 기사 목록 조회"
 *     description: "최근 3일간의 기사들을 대상으로, 조회수(1점)와 좋아요수(3점)를 합산한 인기 점수가 높은 순으로 10개의 목록을 조회합니다. 카테고리별 조회를 지원합니다."
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
 *                 allOf:
 *                   - $ref: '#/components/schemas/ArticleWithFavicon'
 *                   - type: object
 *                     properties:
 *                       popularity_score:
 *                         type: number
 */
router.get("/popular", async (req: Request, res: Response) => {
  const { category } = req.query;

  try {
    let query = `
      SELECT 
        a.id, a.source, a.source_domain, a.title, a.url, a.published_at, a.thumbnail_url,
        (a.view_count + (COUNT(l.id) * 3)) AS popularity_score
      FROM 
        tn_home_article a
      LEFT JOIN 
        tn_article_like l ON a.id = l.article_id
      WHERE 
        a.published_at >= NOW() - INTERVAL 3 DAY
    `;

    const params: string[] = [];
    if (category) {
      query += ` AND a.category = ?`;
      params.push(category as string);
    }

    query += `
      GROUP BY a.id
      ORDER BY popularity_score DESC, a.published_at DESC
      LIMIT 10;
    `;

    const [rows] = await pool.query(query, params);
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
 *     summary: "기사 좋아요 또는 좋아요 취소 (토글)"
 *     description: |
 *       사용자가 특정 기사에 대해 '좋아요'를 누르거나, 이미 누른 '좋아요'를 취소합니다.
 *       - **DB Schema:** `tn_article_like`
 *       - `id`: (PK) '좋아요' 고유 ID
 *       - `user_id`: (FK) 사용자 ID
 *       - `article_id`: (FK) 기사 ID
 *       - `created_at`: '좋아요' 누른 시각
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
 *         description: "요청 성공. 최신 '좋아요' 상태를 반환합니다."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     articleId:
 *                       type: integer
 *                     likes:
 *                       type: integer
 *                     isLiked:
 *                       type: boolean
 *       404:
 *         description: "기사를 찾을 수 없음"
 */
router.post("/:articleId/like", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const articleId = req.params.articleId;
  const userId = req.user?.userId;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. 기사 존재 여부 확인
    const [articleRows]: any = await connection.query("SELECT id FROM tn_article WHERE id = ?", [articleId]);
    if (articleRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Article not found." });
    }

    // 2. 좋아요 취소 시도
    const [deleteResult]: any = await connection.query(
      "DELETE FROM tn_article_like WHERE user_id = ? AND article_id = ?",
      [userId, articleId]
    );

    let isLiked: boolean;
    if (deleteResult.affectedRows > 0) {
      // 성공 시: 좋아요 취소됨
      isLiked = false;
    } else {
      // 실패 시: 좋아요 추가
      await connection.query("INSERT INTO tn_article_like (user_id, article_id) VALUES (?, ?)", [userId, articleId]);
      isLiked = true;
    }

    // 3. 최신 좋아요 수 조회
    const [likeCountRows]: any = await connection.query(
      "SELECT COUNT(*) as likeCount FROM tn_article_like WHERE article_id = ?",
      [articleId]
    );
    const likeCount = likeCountRows[0].likeCount;

    await connection.commit();

    // 4. 최종 상태 반환
    res.status(200).json({
      data: {
        articleId: parseInt(articleId, 10),
        likes: likeCount,
        isLiked: isLiked,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error handling article like toggle:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/articles/{articleId}/like:
 *   delete:
 *     tags:
 *       - Articles
 *     summary: "기사 좋아요 취소 (마이페이지용)"
 *     description: |
 *       특정 기사에 대한 사용자의 '좋아요'를 취소합니다. 마이페이지 등에서 명시적으로 '좋아요'를 삭제할 때 사용합니다.
 *       - **DB Schema:** `tn_article_like`
 *       - `id`: (PK) '좋아요' 고유 ID
 *       - `user_id`: (FK) 사용자 ID
 *       - `article_id`: (FK) 기사 ID
 *       - `created_at`: '좋아요' 누른 시각
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
 *         description: "좋아요 취소 성공. 최신 '좋아요' 상태를 반환합니다."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     articleId:
 *                       type: integer
 *                     likes:
 *                       type: integer
 *                     isLiked:
 *                       type: boolean
 *                       example: false
 */
router.delete("/:articleId/like", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const articleId = req.params.articleId;
  const userId = req.user?.userId;

  const connection = await pool.getConnection();
  try {
    // 1. 좋아요 삭제
    await connection.query("DELETE FROM tn_article_like WHERE user_id = ? AND article_id = ?", [userId, articleId]);

    // 2. 최신 좋아요 수 조회
    const [likeCountRows]: any = await connection.query(
      "SELECT COUNT(*) as likeCount FROM tn_article_like WHERE article_id = ?",
      [articleId]
    );
    const likeCount = likeCountRows[0].likeCount;

    // 3. 최종 상태 반환 (기사가 존재하지 않아도 멱등성을 위해 성공으로 처리)
    res.status(200).json({
      data: {
        articleId: parseInt(articleId, 10),
        likes: likeCount,
        isLiked: false,
      },
    });
  } catch (error) {
    console.error("Error removing article like:", error);
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
router.post("/:articleId/view", optionalAuthenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { articleId } = req.params;
  const userId = req.user?.userId;
  const ip = req.ip;
  const userIdentifier = userId ? `user_${userId}` : `ip_${ip}`;
  const cooldownHours = 24;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [recentViews]: any = await connection.query(
      `SELECT id FROM tn_article_view_log 
       WHERE article_id = ? AND user_identifier = ? AND created_at >= NOW() - INTERVAL ? HOUR`,
      [articleId, userIdentifier, cooldownHours]
    );

    if (recentViews.length > 0) {
      await connection.rollback();
      return res.status(200).json({ message: "View already counted within the cooldown period." });
    }

    await connection.query("INSERT INTO tn_article_view_log (article_id, user_identifier) VALUES (?, ?)", [
      articleId,
      userIdentifier,
    ]);

    const [updateResult]: any = await connection.query(
      "UPDATE tn_article SET view_count = view_count + 1 WHERE id = ?",
      [articleId]
    );

    await connection.commit();

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "Article not found." });
    }

    res.status(200).json({ message: "View count incremented." });
  } catch (error) {
    await connection.rollback();
    console.error(`Error incrementing view count for article ${articleId}:`, error);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
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
router.get("/exclusives", async (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) || "30", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);

  try {
    const query =
      "SELECT id, source, source_domain, url, published_at, title, thumbnail_url FROM tn_home_article WHERE title LIKE '%[단독]%' ORDER BY published_at DESC LIMIT ? OFFSET ?";
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
  const limit = parseInt((req.query.limit as string) || "30", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);

  try {
    const query =
      "SELECT id, source, source_domain, url, published_at, title, thumbnail_url FROM tn_home_article WHERE title LIKE '%[속보]%' ORDER BY published_at DESC LIMIT ? OFFSET ?";
    const [rows] = await pool.query(query, [limit, offset]);
    const articlesWithFavicon = (rows as any[]).map(addFaviconUrl);
    res.json(articlesWithFavicon);
  } catch (error) {
    console.error("Error fetching breaking articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
