import { spawn } from "child_process";
import express, { Request, Response } from "express";
import fs from "fs";
import os from "os";
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

router.post("/login", handleAdminLogin);

// --- 이하 모든 API는 인증이 필요합니다 ---
router.use(authenticateAdmin);

/**
 * @swagger
 * /api/admin/inquiries:
 *   get:
 *     tags: [Admin]
 *     summary: 모든 문의 목록 조회
 *     description: 사용자들이 제출한 모든 문의 목록을 최신순으로 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: "한 번에 가져올 문의 수"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "건너뛸 문의 수 (페이지네이션용)"
 *     responses:
 *       200:
 *         description: 문의 목록
 */
router.get("/inquiries", async (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) || "25", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        i.id, i.subject, i.status, i.created_at, 
        u.nickname as user_nickname
      FROM 
        tn_inquiry i
      LEFT JOIN 
        tn_user u ON i.user_id = u.id
      ORDER BY 
        i.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/inquiries/{inquiryId}:
 *   get:
 *     tags: [Admin]
 *     summary: 특정 문의 상세 조회
 *     description: "특정 문의의 상세 내용과, 답변이 있을 경우 답변 내용까지 함께 조회합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 문의 상세 내용
 *       404:
 *         description: 문의를 찾을 수 없음
 */
router.get("/inquiries/:inquiryId", async (req: Request, res: Response) => {
  const { inquiryId } = req.params;

  try {
    // 1. 문의 원본 내용 조회 (사용자 정보 포함)
    const [inquiryRows]: any = await pool.query(
      `
      SELECT 
        i.id, i.subject, i.content, i.file_path, i.status, i.created_at,
        u.nickname as user_nickname, u.email as user_email
      FROM 
        tn_inquiry i
      LEFT JOIN 
        tn_user u ON i.user_id = u.id
      WHERE
        i.id = ?
      `,
      [inquiryId]
    );

    if (inquiryRows.length === 0) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    // 2. 답변 내용 조회
    const [replyRows]: any = await pool.query("SELECT * FROM tn_inquiry_reply WHERE inquiry_id = ?", [inquiryId]);

    res.json({
      inquiry: inquiryRows[0],
      reply: replyRows.length > 0 ? replyRows[0] : null,
    });
  } catch (error) {
    console.error(`Error fetching inquiry details for ID ${inquiryId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/inquiries/{inquiryId}/reply:
 *   post:
 *     tags: [Admin]
 *     summary: 특정 문의에 대한 답변 작성
 *     description: "관리자가 특정 문의에 대한 답변을 작성합니다. 답변이 등록되면 원본 문의의 상태는 'REPLIED'로 변경됩니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: integer
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
 *                 description: "답변 내용"
 *     responses:
 *       201:
 *         description: "답변이 성공적으로 등록되었습니다."
 *       400:
 *         description: "답변 내용이 비어있습니다."
 *       409:
 *         description: "이미 답변이 등록된 문의입니다."
 */
router.post("/inquiries/:inquiryId/reply", async (req: Request, res: Response) => {
  const { inquiryId } = req.params;
  const { content } = req.body;
  const adminUsername = (req as any).admin?.username;

  if (!adminUsername) {
    return res.status(401).json({ message: "Admin user not found in token." });
  }

  if (!content) {
    return res.status(400).json({ message: "답변 내용을 입력해주세요." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. 답변 저장
    await connection.query("INSERT INTO tn_inquiry_reply (inquiry_id, admin_username, content) VALUES (?, ?, ?)", [
      inquiryId,
      adminUsername,
      content,
    ]);

    // 2. 원본 문의 상태 변경
    const [updateResult]: any = await connection.query("UPDATE tn_inquiry SET status = 'RESOLVED' WHERE id = ?", [
      inquiryId,
    ]);

    if (updateResult.affectedRows === 0) {
      throw new Error("Failed to update inquiry status. Inquiry may not exist.");
    }

    await connection.commit();
    res.status(201).json({ message: "답변이 성공적으로 등록되었습니다." });
  } catch (error) {
    await connection.rollback();
    console.error(`Error replying to inquiry ${inquiryId}:`, error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    connection.release();
  }
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
 *     summary: 제안됨 상태의 토픽 후보 목록 조회 (현재 비활성화)
 *     description: "토픽 자동 발굴 기능이 비활성화되어, 이 API는 항상 빈 목록을 반환합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 빈 토픽 목록
 */
router.get("/topics/suggested", async (req: Request, res: Response) => {
  // 토픽 자동 발굴 기능이 비활성화되었으므로 항상 빈 배열을 반환합니다.
  res.json([]);
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
      "SELECT id, display_name, published_at FROM tn_topic WHERE status = 'published' AND topic_type = 'CONTENT' ORDER BY published_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching published topics:", error);
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

    // 기사 수집 스크립트 자동 실행 로직은 제거됨. 관리자가 로컬에서 수동 실행.
    res.json({ message: `Topic ${topicId} has been published. Please collect articles manually.` });
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
      "SELECT id, display_name, published_at FROM tn_topic WHERE status = 'published' AND topic_type = 'CONTENT' ORDER BY published_at DESC"
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
      "INSERT INTO tn_topic (display_name, search_keywords, summary, status, collection_status, published_at) VALUES (?, ?, ?, 'published', 'pending', NOW())",
      [displayName, searchKeywords, summary || ""]
    );
    const newTopicId = result.insertId;

    const pythonScriptPath = path.join(__dirname, "../../../news-data/article_collector.py");
    const pythonCommand = process.env.PYTHON_EXECUTABLE_PATH || (os.platform() === "win32" ? "python" : "python3");
    const args = ["-u", pythonScriptPath, newTopicId.toString()];

    console.log(`Executing: ${pythonCommand} ${args.join(" ")}`);
    const pythonProcess = spawn(pythonCommand, args);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[article_collector.py stdout]: ${data.toString().trim()}`);
    });
    // --- Real-time notification ---
    const io = req.app.get("io");
    const userSocketMap = req.app.get("userSocketMap");

    if (io && userSocketMap) {
      try {
        // 'NEW_TOPIC' 알림을 켜놓은 사용자 + 설정하지 않은 사용자 (기본값 true) 찾기
        const [usersToNotify]: any = await pool.query(`
          SELECT u.id FROM tn_user u
          LEFT JOIN tn_user_notification_settings s 
            ON u.id = s.user_id AND s.notification_type = 'NEW_TOPIC'
          WHERE s.is_enabled IS NULL OR s.is_enabled = 1
        `);

        const notification = {
          type: "NEW_TOPIC",
          data: {
            id: newTopicId,
            displayName: displayName,
            summary: summary || "",
          },
        };

        for (const user of usersToNotify) {
          const socketId = userSocketMap.get(user.id);
          if (socketId) {
            io.to(socketId).emit("new_notification", notification);
            console.log(`Sent NEW_TOPIC notification to user ${user.id} on socket ${socketId}`);
          }
        }
      } catch (notificationError) {
        console.error("Failed to send new topic notifications:", notificationError);
      }
    }
    // --------------------------

    res.status(201).json({ message: `Topic ${newTopicId} has been created and published`, topicId: newTopicId });
  } catch (error) {
    console.error("Error creating new topic:", error);
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

    const pythonCommand = process.env.PYTHON_EXECUTABLE_PATH || (os.platform() === "win32" ? "python" : "python3");
    const pythonScriptPath = path.join(__dirname, "../../../news-data/article_collector.py");
    const args = ["-u", pythonScriptPath, topicId];

    console.log(`Executing: ${pythonCommand} ${args.join(" ")}`);
    const pythonProcess = spawn(pythonCommand, args);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[recollect stdout]: ${data.toString().trim()}`);
    });
    pythonProcess.stderr.on("data", (data) => {
      console.error(`[recollect stderr]: ${data.toString().trim()}`);
    });

    res.json({ message: `Recollection started for topic ${topicId}.`, searchKeywords: normalizedKeywords });
  } catch (error) {
    console.error("Error starting recollection:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/download:
 *   get:
 *     tags: [Admin]
 *     summary: 첨부파일 다운로드 (관리자용)
 *     description: "관리자가 문의 내역의 첨부파일을 안전하게 다운로드합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: "다운로드할 파일의 경로"
 *     responses:
 *       200:
 *         description: "파일 다운로드 성공"
 *       403:
 *         description: "접근 금지"
 *       404:
 *         description: "파일을 찾을 수 없음"
 */
router.get("/download", (req: Request, res: Response) => {
  const requestedRelativePath = req.query.path as string;

  if (!requestedRelativePath) {
    return res.status(400).json({ message: "파일 경로가 필요합니다." });
  }

  const appRoot = path.resolve(__dirname, '..', '..');
  // Create an absolute path from the app root and the relative path from DB
  const requestedAbsolutePath = path.join(appRoot, requestedRelativePath);

  // For security, resolve it to a canonical path and check it's within the uploads folder
  const canonicalPath = path.resolve(requestedAbsolutePath);
  const uploadDir = path.resolve(appRoot, 'uploads');

  if (!canonicalPath.startsWith(uploadDir)) {
    return res.status(403).json({ message: "허용되지 않은 파일에 대한 접근입니다." });
  }

  if (fs.existsSync(canonicalPath)) {
    res.download(canonicalPath, (err) => {
      if (err) {
        console.error("File download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "파일을 다운로드하는 중 오류가 발생했습니다." });
        }
      }
    });
  } else {
    console.error(`[Download API] File not found at path: ${canonicalPath}`);
    res.status(404).json({ message: "파일을 찾을 수 없습니다." });
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}/unpublish-all-articles:
 *   post:
 *     tags: [Admin]
 *     summary: 특정 토픽의 모든 발행된 기사를 제안됨 상태로 변경
 *     description: "특정 토픽 ID에 속한 모든 'published' 상태의 기사들을 'suggested' 상태로 일괄 변경합니다."
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
 *         description: "성공적으로 처리되었으며, 변경된 기사의 수를 반환합니다."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updatedCount:
 *                   type: integer
 *       404:
 *         description: "토픽을 찾을 수 없거나, 변경할 기사가 없습니다."
 */
router.post("/topics/:topicId/unpublish-all-articles", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    const [result]: any = await pool.query(
      "UPDATE tn_article SET status = 'suggested' WHERE topic_id = ? AND status = 'published'",
      [topicId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No published articles found for this topic to unpublish." });
    }

    res.json({
      message: `Successfully unpublished all articles for topic ${topicId}.`,
      updatedCount: result.affectedRows,
    });
  } catch (error) {
    console.error("Error unpublishing all articles for topic:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}/delete-all-suggested:
 *   post:
 *     tags: [Admin]
 *     summary: 특정 토픽의 모든 제안된 기사를 삭제 상태로 변경
 *     description: "특정 토픽 ID에 속한 모든 'suggested' 상태의 기사들을 'deleted' 상태로 일괄 변경합니다."
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
 *         description: "성공적으로 처리되었으며, 삭제 처리된 기사의 수를 반환합니다."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       404:
 *         description: "토픽을 찾을 수 없거나, 삭제할 제안된 기사가 없습니다."
 */
router.post("/topics/:topicId/delete-all-suggested", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    const [result]: any = await pool.query(
      "UPDATE tn_article SET status = 'deleted' WHERE topic_id = ? AND status = 'suggested'",
      [topicId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No suggested articles found for this topic to delete." });
    }

    res.json({
      message: `Successfully deleted all suggested articles for topic ${topicId}.`,
      deletedCount: result.affectedRows,
    });
  } catch (error) {
    console.error("Error deleting all suggested articles for topic:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/list-by-popularity:
 *   get:
 *     tags: [Admin]
 *     summary: 발행됨 상태의 모든 토픽 목록을 인기순으로 조회
 *     description: "관리자 페이지 사이드바를 위해, 모든 발행된 토픽을 popularity_score가 높은 순으로 정렬하여 반환합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 인기순으로 정렬된 토픽 목록
 */
router.get("/topics/list-by-popularity", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, display_name, published_at, popularity_score FROM tn_topic WHERE status = 'published' AND topic_type = 'CONTENT' ORDER BY popularity_score DESC, published_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching topics by popularity:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

export default router;
