import express from "express";
import pool from "../config/db";
import { authenticateUser, AuthenticatedRequest } from "../middleware/userAuth";

const router = express.Router();

// 이 라우터의 모든 경로는 /api/saved 로 시작하며, 인증이 필요합니다.
router.use(authenticateUser);

/**
 * @swagger
 * /api/saved/categories:
 *   post:
 *     tags:
 *       - Saved Articles
 *     summary: 새 카테고리 생성
 *     description: "로그인한 사용자가 저장된 기사를 분류할 새로운 카테고리를 생성합니다."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: "생성할 카테고리의 이름"
 *                 example: "나중에 읽을 기사"
 *     responses:
 *       201:
 *         description: "카테고리 생성 성공"
 *       400:
 *         description: "카테고리 이름이 비어있음"
 *       409:
 *         description: "이미 존재하는 카테고리 이름"
 */
router.post("/categories", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: "카테고리 이름을 입력해주세요." });
  }

  try {
    const [result]: any = await pool.query(
      "INSERT INTO tn_user_saved_article_categories (user_id, name) VALUES (?, ?)",
      [userId, name.trim()]
    );
    res.status(201).json({ id: result.insertId, name: name.trim() });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "이미 존재하는 카테고리 이름입니다." });
    }
    console.error("Error creating category:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/saved/categories:
 *   get:
 *     tags:
 *       - Saved Articles
 *     summary: 내 모든 카테고리 조회
 *     description: "로그인한 사용자가 생성한 모든 카테고리 목록을 반환합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "카테고리 목록"
 */
router.get("/categories", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;

  try {
    const [rows] = await pool.query(
      "SELECT id, name, created_at FROM tn_user_saved_article_categories WHERE user_id = ? ORDER BY created_at ASC",
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/saved/articles:
 *   get:
 *     tags:
 *       - Saved Articles
 *     summary: 저장된 기사 목록 조회
 *     description: "로그인한 사용자가 저장한 기사 목록을 반환합니다. 특정 카테고리로 필터링할 수 있습니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: "조회할 카테고리의 ID (미지정 시 전체 저장 기사 조회)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: "저장된 기사 목록"
 */
router.get("/articles", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  const { categoryId } = req.query;
  const limit = parseInt(req.query.limit as string || '25', 10);
  const offset = parseInt(req.query.offset as string || '0', 10);

  let query = `
    SELECT 
      s.id as saved_article_id, s.category_id, s.created_at as saved_at,
      a.id as article_id, a.title, a.url, a.thumbnail_url, a.source, a.source_domain, a.published_at
    FROM 
      tn_user_saved_articles s
    JOIN 
      tn_home_article a ON s.article_id = a.id
    WHERE 
      s.user_id = ?
  `;
  const params: (string | number)[] = [userId!];

  if (categoryId) {
    query += " AND s.category_id = ?";
    params.push(categoryId as string);
  }

  query += " ORDER BY s.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching saved articles:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/saved/articles/{savedArticleId}:
 *   put:
 *     tags:
 *       - Saved Articles
 *     summary: 저장된 기사를 특정 카테고리로 이동
 *     description: "저장된 기사의 카테고리를 변경합니다. categoryId를 null로 보내면 카테고리에서 제외됩니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: savedArticleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "카테고리를 변경할 '저장된 기사'의 고유 ID (tn_user_saved_articles.id)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 nullable: true
 *                 description: "이동할 카테고리의 ID. null을 보내면 카테고리 없음으로 설정됩니다."
 *     responses:
 *       200:
 *         description: "카테고리 변경 성공"
 *       403:
 *         description: "자신의 저장된 기사가 아님"
 *       404:
 *         description: "저장된 기사 또는 카테고리를 찾을 수 없음"
 */
router.put("/articles/:savedArticleId", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  const { savedArticleId } = req.params;
  const { categoryId } = req.body; // categoryId can be null

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 사용자가 소유한 카테고리가 맞는지 확인 (null은 허용)
    if (categoryId) {
      const [categoryRows]: any = await connection.query(
        "SELECT id FROM tn_user_saved_article_categories WHERE id = ? AND user_id = ?",
        [categoryId, userId]
      );
      if (categoryRows.length === 0) {
        await connection.rollback();
        return res.status(403).json({ message: "자신의 카테고리가 아니거나 존재하지 않는 카테고리입니다." });
      }
    }

    // 사용자가 소유한 저장된 기사가 맞는지 확인하며 업데이트
    const [updateResult]: any = await connection.query(
      "UPDATE tn_user_saved_articles SET category_id = ? WHERE id = ? AND user_id = ?",
      [categoryId, savedArticleId, userId]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "자신이 저장한 기사가 아니거나, 해당 기사를 찾을 수 없습니다." });
    }

    await connection.commit();
    res.status(200).json({ message: "카테고리가 업데이트되었습니다." });

  } catch (error) {
    await connection.rollback();
    console.error("Error updating article category:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/saved/categories/{categoryId}:
 *   put:
 *     tags:
 *       - Saved Articles
 *     summary: 카테고리 이름 변경
 *     description: "로그인한 사용자가 생성한 카테고리의 이름을 변경합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: "새로운 카테고리 이름"
 *     responses:
 *       200:
 *         description: "이름 변경 성공"
 *       400:
 *         description: "카테고리 이름이 비어있음"
 *       403:
 *         description: "자신의 카테고리가 아님"
 *       409:
 *         description: "이미 사용 중인 카테고리 이름"
 */
router.put("/categories/:categoryId", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  const { categoryId } = req.params;
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: "카테고리 이름을 입력해주세요." });
  }

  try {
    const [updateResult]: any = await pool.query(
      "UPDATE tn_user_saved_article_categories SET name = ? WHERE id = ? AND user_id = ?",
      [name.trim(), categoryId, userId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(403).json({ message: "자신의 카테고리가 아니거나, 카테고리를 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "카테고리 이름이 변경되었습니다." });

  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "이미 사용 중인 카테고리 이름입니다." });
    }
    console.error("Error renaming category:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/saved/categories/{categoryId}:
 *   delete:
 *     tags:
 *       - Saved Articles
 *     summary: 카테고리 삭제
 *     description: "로그인한 사용자가 생성한 카테고리를 삭제합니다. 카테고리 안의 기사들은 삭제되지 않고 미분류 상태가 됩니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "카테고리 삭제 성공"
 *       403:
 *         description: "자신의 카테고리가 아님"
 */
router.delete("/categories/:categoryId", async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  const { categoryId } = req.params;

  try {
    const [deleteResult]: any = await pool.query(
      "DELETE FROM tn_user_saved_article_categories WHERE id = ? AND user_id = ?",
      [categoryId, userId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(403).json({ message: "자신의 카테고리가 아니거나, 카테고리를 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "카테고리가 삭제되었습니다." });

  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

export default router;
