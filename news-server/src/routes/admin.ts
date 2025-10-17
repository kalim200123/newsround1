import { exec } from "child_process";
import express, { Request, Response } from "express";
import path from "path";
import pool from "../config/db";
import { authenticateAdmin, handleAdminLogin } from "../middleware/auth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: 관리자 전용 API
 */

/**
 * @swagger
 * /api/admin/health:
 *   get:
 *     tags: [Admin]
 *     summary: Admin API 상태 확인
 *     responses:
 *       200:
 *         description: Admin API가 정상적으로 동작하고 있습니다.
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     tags: [Admin]
 *     summary: 관리자 로그인
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공, JWT 토큰 반환
 *       401:
 *         description: 잘못된 인증 정보
 */
router.post("/login", handleAdminLogin);

// --- 이하 모든 API는 인증이 필요합니다 ---
router.use(authenticateAdmin);

/**
 * @swagger
 * /api/admin/topics/suggested:
 *   get:
 *     tags: [Admin]
 *     summary: 제안됨 상태의 토픽 후보 목록 조회
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 제안된 토픽 목록
 *       401:
 *         description: 인증 실패
 */
router.get("/topics/suggested", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tn_topic WHERE status = 'suggested' ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching suggested topics:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/published:
 *   get:
 *     tags: [Admin]
 *     summary: 발행됨 상태의 모든 토픽 목록 조회
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 발행된 토픽 목록
 *       401:
 *         description: 인증 실패
 */
router.get("/topics/published", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, display_name, published_at FROM tn_topic WHERE status = 'published' ORDER BY published_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching published topics:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics:
 *   post:
 *     tags: [Admin]
 *     summary: 관리자가 직접 새 토픽을 생성하고 즉시 발행
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [displayName, searchKeywords]
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: "새로운 토픽"
 *               searchKeywords:
 *                 type: string
 *                 example: "키워드1,키워드2"
 *               summary:
 *                 type: string
 *                 example: "이 토픽에 대한 요약입니다."
 *     responses:
 *       201:
 *         description: 토픽 생성 및 발행 성공
 */
router.post("/topics", async (req: Request, res: Response) => {
  const { displayName, searchKeywords, summary } = req.body;

  if (!displayName || !searchKeywords) {
    return res.status(400).json({ message: "Display name and search keywords are required." });
  }

  try {
    const [result]: any = await pool.query(
      "INSERT INTO tn_topic (core_keyword, sub_description, display_name, search_keywords, summary, status, collection_status, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'pending', NOW())",
      [displayName, "관리자 직접 생성", displayName, searchKeywords, summary || ""]
    );
    const newTopicId = result.insertId;

    if (!newTopicId) {
      throw new Error("Failed to create new topic, no insertId returned.");
    }

    const pythonScriptPath = path.join(__dirname, "../../../news-data/article_collector.py");
    const command = `python "${pythonScriptPath}" ${newTopicId}`;

    console.log(`Executing command: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing article_collector.py: ${error}`);
        return;
      }
      console.log(`article_collector.py stdout: ${stdout}`);
      console.error(`article_collector.py stderr: ${stderr}`);
    });

    res
      .status(201)
      .json({ message: `Topic ${newTopicId} has been created and published. Article collection started.` });
  } catch (error) {
    console.error("Error creating new topic:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}/publish:
 *   patch:
 *     tags: [Admin]
 *     summary: 제안된 토픽을 발행됨 상태로 변경
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [displayName, searchKeywords]
 *             properties:
 *               displayName:
 *                 type: string
 *               searchKeywords:
 *                 type: string
 *               summary:
 *                 type: string
 *     responses:
 *       200:
 *         description: 토픽 발행 성공
 */
router.patch("/topics/:topicId/publish", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const { displayName, searchKeywords, summary } = req.body;

  if (!displayName || !searchKeywords) {
    return res.status(400).json({ message: "Display name and search keywords are required." });
  }

  try {
    const [result]: any = await pool.query(
      "UPDATE tn_topic SET status = 'published', collection_status = 'pending', display_name = ?, search_keywords = ?, summary = ?, published_at = NOW() WHERE id = ? AND status = 'suggested'",
      [displayName, searchKeywords, summary, topicId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Topic not found or already handled." });
    }

    const pythonScriptPath = path.join(__dirname, "../../../news-data/article_collector.py");
    const command = `python "${pythonScriptPath}" ${topicId}`;

    console.log(`Executing command: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing article_collector.py: ${error}`);
        return;
      }
      console.log(`article_collector.py stdout: ${stdout}`);
      console.error(`article_collector.py stderr: ${stderr}`);
    });

    res.json({ message: `Topic ${topicId} has been published. Article collection started in the background.` });
  } catch (error) {
    console.error("Error publishing topic:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: 제안된 토픽을 거절됨 상태로 변경
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 토픽 거절 성공
 */
router.patch("/topics/:topicId/reject", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    const [result]: any = await pool.query(
      "UPDATE tn_topic SET status = 'rejected' WHERE id = ? AND status = 'suggested'",
      [topicId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Topic not found or already handled." });
    }

    res.json({ message: `Topic ${topicId} has been rejected.` });
  } catch (error) {
    console.error("Error rejecting topic:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}/archive:
 *   patch:
 *     tags: [Admin]
 *     summary: 발행된 토픽을 보관됨 상태로 변경
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 토픽 보관 성공
 */
router.patch("/topics/:topicId/archive", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    const [result]: any = await pool.query(
      "UPDATE tn_topic SET status = 'archived' WHERE id = ? AND status = 'published'",
      [topicId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Topic not found or not published." });
    }

    res.json({ message: `Topic ${topicId} has been archived.` });
  } catch (error) {
    console.error("Error archiving topic:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}/articles:
 *   get:
 *     tags: [Admin]
 *     summary: 특정 토픽에 속한 기사 목록 조회
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 기사 목록
 */
router.get("/topics/:topicId/articles", async (req: Request, res: Response) => {
  const { topicId } = req.params;

  const numericTopicId = parseInt(topicId, 10);
  if (isNaN(numericTopicId)) {
    return res.status(400).json({ message: "Invalid topic ID." });
  }

  try {
    const [articles] = await pool.query("SELECT * FROM tn_article WHERE topic_id = ? ORDER BY `display_order` ASC", [
      numericTopicId,
    ]);
    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles for topic:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}/articles/order:
 *   patch:
 *     tags: [Admin]
 *     summary: 특정 토픽 내 기사들의 진영별 순서 변경
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               left:
 *                 type: array
 *                 items:
 *                   type: integer
 *               right:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 순서 변경 성공
 */
router.patch("/topics/:topicId/articles/order", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const { left, right } = req.body;

  const numericTopicId = parseInt(topicId, 10);
  if (isNaN(numericTopicId)) {
    return res.status(400).json({ message: "Invalid topic ID." });
  }

  if (!Array.isArray(left) || !Array.isArray(right)) {
    return res.status(400).json({ message: "Invalid request body. 'left' and 'right' arrays are required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (let i = 0; i < left.length; i++) {
      const articleId = left[i];
      const displayOrder = i;
      await connection.query("UPDATE tn_article SET display_order = ? WHERE id = ? AND topic_id = ?", [
        displayOrder,
        articleId,
        numericTopicId,
      ]);
    }

    for (let i = 0; i < right.length; i++) {
      const articleId = right[i];
      const displayOrder = i;
      await connection.query("UPDATE tn_article SET display_order = ? WHERE id = ? AND topic_id = ?", [
        displayOrder,
        articleId,
        numericTopicId,
      ]);
    }

    await connection.commit();
    res.json({ message: "Article order updated successfully." });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating article order:", error);
    res.status(500).json({ message: "Server error while updating article order." });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/admin/articles/{articleId}/feature:
 *   patch:
 *     tags: [Admin]
 *     summary: 특정 기사를 대표 기사로 설정
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
 *         description: 대표 기사 설정 성공
 */
router.patch("/articles/:articleId/feature", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows]: any = await connection.query("SELECT topic_id, side FROM tn_article WHERE id = ?", [articleId]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Article not found." });
    }
    const { topic_id, side } = rows[0];

    await connection.query("UPDATE tn_article SET is_featured = FALSE WHERE topic_id = ? AND side = ?", [
      topic_id,
      side,
    ]);

    await connection.query("UPDATE tn_article SET is_featured = TRUE WHERE id = ?", [articleId]);

    await connection.commit();
    res.json({ message: `Article ${articleId} has been set as featured.` });
  } catch (error) {
    await connection.rollback();
    console.error("Error featuring article:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/admin/articles/{articleId}/delete:
 *   patch:
 *     tags: [Admin]
 *     summary: 특정 기사를 삭제됨 상태로 변경
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
 *         description: 기사 삭제 성공
 */
router.patch("/articles/:articleId/delete", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  try {
    const [result]: any = await pool.query("UPDATE tn_article SET status = 'deleted' WHERE id = ?", [articleId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Article not found." });
    }
    res.json({ message: `Article ${articleId} has been deleted.` });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/articles/{articleId}/publish:
 *   patch:
 *     tags: [Admin]
 *     summary: 특정 기사의 상태를 발행됨으로 변경
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *                 description: "YYYY-MM-DD HH:mm 형식"
 *     responses:
 *       200:
 *         description: 기사 발행 성공
 */
router.patch("/articles/:articleId/publish", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  const { publishedAt } = req.body as { publishedAt?: string };

  let normalizedPublishedAt: string | null = null;
  if (typeof publishedAt === "string") {
    const trimmed = publishedAt.trim();
    if (trimmed) {
      const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?$/);
      if (!match) {
        return res.status(400).json({ message: "Invalid publishedAt format. Use YYYY-MM-DD HH:mm" });
      }
      const seconds = match[3] ? `:${match[3]}` : ":00";
      normalizedPublishedAt = `${match[1]} ${match[2]}${seconds}`;
    }
  } else if (publishedAt !== undefined) {
    return res.status(400).json({ message: "publishedAt must be a string when provided." });
  }

  try {
    const updateFields: string[] = ["status = 'published'"];
    const params: Array<string | number> = [];

    if (normalizedPublishedAt) {
      updateFields.push("published_at = ?");
      params.push(normalizedPublishedAt);
    }

    params.push(articleId);

    const sql = `UPDATE tn_article SET ${updateFields.join(", ")} WHERE id = ?`;
    const [result]: any = await pool.query(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Article not found." });
    }
    res.json({ message: `Article ${articleId} has been published.` });
  } catch (error) {
    console.error("Error publishing article:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/articles/{articleId}/unpublish:
 *   patch:
 *     tags: [Admin]
 *     summary: 발행된 기사를 다시 제안됨 상태로 변경
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
 *         description: 기사 발행 취소 성공
 */
router.patch("/articles/:articleId/unpublish", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  try {
    const [result]: any = await pool.query(
      "UPDATE tn_article SET status = 'suggested' WHERE id = ? AND status = 'published'",
      [articleId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Article not found or not published." });
    }
    res.json({ message: `Article ${articleId} has been unpublished.` });
  } catch (error) {
    console.error("Error unpublishing article:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}/recollect:
 *   post:
 *     tags: [Admin]
 *     summary: 특정 토픽에 대해 기사 재수집을 트리거
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               searchKeywords:
 *                 type: string
 *                 description: "재수집 시 사용할 새로운 검색 키워드 (선택 사항)"
 *     responses:
 *       200:
 *         description: 재수집 작업 시작됨
 */
router.post("/topics/:topicId/recollect", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const payload = req.body as { searchKeywords?: string };
  const normalizedKeywords = typeof payload?.searchKeywords === "string" ? payload.searchKeywords.trim() : undefined;

  try {
    const [rows]: any = await pool.query("SELECT id FROM tn_topic WHERE id = ? AND status = 'published'", [topicId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Published topic not found." });
    }

    if (normalizedKeywords) {
      await pool.query(
        "UPDATE tn_topic SET collection_status = 'pending', search_keywords = ?, updated_at = NOW() WHERE id = ?",
        [normalizedKeywords, topicId]
      );
    } else {
      await pool.query("UPDATE tn_topic SET collection_status = 'pending', updated_at = NOW() WHERE id = ?", [topicId]);
    }

    const pythonScriptPath = path.join(__dirname, "../../../news-data/article_collector.py");
    const command = `python "${pythonScriptPath}" ${topicId}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing article_collector.py for recollect: ${error}`);
        return;
      }
      console.log(`Recollect stdout: ${stdout}`);
      console.error(`Recollect stderr: ${stderr}`);
    });

    res.json({ message: `Recollection started for topic ${topicId}.`, searchKeywords: normalizedKeywords });
  } catch (error) {
    console.error("Error starting recollection:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

export default router;