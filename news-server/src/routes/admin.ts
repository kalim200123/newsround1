import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { spawn } from "child_process";
import express, { Request, Response } from "express";
import fs from "fs";
import os from "os";
import path from "path";
import pool from "../config/db";
import { authenticateAdmin, handleAdminLogin } from "../middleware/auth";

const router = express.Router();

// S3 클라이언트 초기화
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: 관리자 대시보드 통계 조회
 *     description: 대시보드에 필요한 주요 통계 지표를 한 번에 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 통계 데이터
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topics:
 *                   type: object
 *                   properties:
 *                     published:
 *                       type: integer
 *                 inquiries:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pending:
 *                       type: integer
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     today:
 *                       type: integer
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const queries = [
      pool.query("SELECT COUNT(*) as count FROM tn_topic WHERE status = 'OPEN' AND topic_type = 'VOTING'"),
      pool.query("SELECT COUNT(*) as count FROM tn_inquiry"),
      pool.query("SELECT COUNT(*) as count FROM tn_inquiry WHERE status = 'SUBMITTED'"),
      pool.query("SELECT COUNT(*) as count FROM tn_user"),
      pool.query("SELECT COUNT(*) as count FROM tn_user WHERE created_at >= CURDATE()"),
    ];

    const results = await Promise.all(queries);

    const stats = {
      topics: {
        published: (results[0][0] as any)[0].count,
      },
      inquiries: {
        total: (results[1][0] as any)[0].count,
        pending: (results[2][0] as any)[0].count,
      },
      users: {
        total: (results[3][0] as any)[0].count,
        today: (results[4][0] as any)[0].count,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "통계 데이터를 불러오는 중 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/admin/stats/visitors/weekly:
 *   get:
 *     tags: [Admin]
 *     summary: 주간 순 방문자 수 통계 조회
 *     description: "지난 7일간의 일일 순 방문자 수(unique visitors)를 조회하여 차트용 데이터로 반환합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "지난 7일간의 방문자 수 데이터 배열"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                   visitors:
 *                     type: integer
 */
router.get("/stats/visitors/weekly", async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(DISTINCT user_identifier) as visitors
      FROM
        tn_topic_view_log
      WHERE
        created_at >= CURDATE() - INTERVAL 6 DAY
      GROUP BY
        date
      ORDER BY
        date ASC;
    `);

    // Create a map of dates to visitor counts from the query results
    const visitorMap = new Map(rows.map((row: any) => [row.date, row.visitors]));

    // Create a complete 7-day array, filling in missing days with 0
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];

      weeklyData.push({
        date: dateString,
        visitors: visitorMap.get(dateString) || 0,
      });
    }

    res.json(weeklyData);
  } catch (error) {
    console.error("Error fetching weekly visitor stats:", error);
    res.status(500).json({ message: "주간 방문자 통계를 불러오는 중 오류가 발생했습니다." });
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
 * /api/admin/download:
 *   get:
 *     tags: [Admin]
 *     summary: 첨부파일 다운로드 URL 조회 (관리자용)
 *     description: "관리자가 문의 내역의 S3 첨부파일을 다운로드할 수 있는 임시 URL을 생성합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: "다운로드할 파일의 S3 키 (file_path)"
 *     responses:
 *       200:
 *         description: "다운로드용 Presigned URL"
 *       400:
 *         description: "잘못된 요청"
 *       404:
 *         description: "파일을 찾을 수 없음"
 */
router.get("/download", async (req: Request, res: Response) => {
  const s3Key = req.query.path as string;

  if (!s3Key) {
    return res.status(400).json({ message: "파일 경로가 필요합니다." });
  }
  if (!process.env.AWS_S3_BUCKET_NAME) {
    return res.status(500).json({ message: "S3 버킷 이름이 설정되지 않았습니다." });
  }

  try {
    // Security Check: Verify the file exists in an inquiry record to get its original name
    const [inquiryRows]: any = await pool.query("SELECT file_originalname FROM tn_inquiry WHERE file_path = ?", [
      s3Key,
    ]);

    if (inquiryRows.length === 0) {
      // Although it's an admin, we check if the file path is valid to prevent random S3 access
      return res.status(404).json({ message: "해당 경로의 문의 파일을 찾을 수 없습니다." });
    }

    const originalName = inquiryRows[0].file_originalname || path.basename(s3Key);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalName)}"`,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

    res.json({ url: presignedUrl });
  } catch (error) {
    console.error("Error creating admin presigned URL for download:", error);
    res.status(500).json({ message: "파일 다운로드 URL을 생성하는 중 오류가 발생했습니다." });
  }
});

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
        i.id, i.subject, i.content, i.file_path, i.file_originalname, i.status, i.created_at,
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
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: 모든 사용자 목록을 페이지네이션으로 조회
 *     description: 모든 사용자 목록을 최신순으로 조회합니다. 페이지네이션을 지원합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: "한 번에 가져올 사용자 수"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "가져올 페이지 번호"
 *     responses:
 *       200:
 *         description: 사용자 목록과 전체 개수
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 */
router.get("/users", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const page = parseInt(req.query.page as string, 10) || 1;
  const offset = (page - 1) * limit;

  try {
    const queries = [
      pool.query(
        "SELECT id, email, nickname, status, warning_count, created_at FROM tn_user ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [limit, offset]
      ),
      pool.query("SELECT COUNT(*) as total FROM tn_user"),
    ];

    const results = await Promise.all(queries);
    const users = results[0][0];
    const total = (results[1][0] as any)[0].total;

    res.json({ users, total });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: 특정 사용자 상세 정보 조회
 *     description: 특정 사용자의 상세 정보를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자 상세 정보
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.get("/users/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const [rows]: any = await pool.query(
      "SELECT id, email, nickname, name, phone, status, warning_count, created_at, profile_image_url, introduction FROM tn_user WHERE id = ?",
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = rows[0];
    // Ensure profile_image_url is an absolute path
    if (user.profile_image_url && !user.profile_image_url.startsWith("http")) {
      user.profile_image_url = `${req.protocol}://${req.get("host")}${user.profile_image_url}`;
    }
    res.json(user);
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   patch:
 *     tags: [Admin]
 *     summary: 특정 사용자 정보 업데이트
 *     description: 특정 사용자의 상태(status) 또는 경고 횟수(warning_count)를 업데이트합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, SUSPENDED]
 *               warning_count:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 업데이트 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.patch("/users/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status, warning_count } = req.body;

  if (!status && warning_count === undefined) {
    return res.status(400).json({ message: "At least one field (status or warning_count) is required." });
  }

  const updateFields = [];
  const params = [];

  if (status) {
    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    updateFields.push("status = ?");
    params.push(status);
  }

  if (warning_count !== undefined) {
    const count = parseInt(warning_count, 10);
    if (isNaN(count) || count < 0) {
      return res.status(400).json({ message: "Invalid warning_count value." });
    }
    updateFields.push("warning_count = ?");
    params.push(count);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: "No valid fields to update." });
  }

  params.push(userId);

  try {
    const [result]: any = await pool.query(`UPDATE tn_user SET ${updateFields.join(", ")} WHERE id = ?`, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found or no changes were made." });
    }

    res.json({ message: "User updated successfully." });
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/comments:
 *   get:
 *     tags: [Admin]
 *     summary: 특정 사용자가 작성한 모든 댓글 조회
 *     description: 특정 사용자가 작성한 모든 댓글을 최신순으로 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자가 작성한 댓글 목록
 */
router.get("/users/:userId/comments", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const page = parseInt(req.query.page as string, 10) || 1;
  const offset = (page - 1) * limit;

  try {
    const [comments] = await pool.query(
      `
      SELECT 
        c.id,
        c.content,
        c.created_at,
        c.status,
        t.id as topic_id,
        t.display_name as topic_name
      FROM tn_topic_comment c
      JOIN tn_topic t ON c.topic_id = t.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [userId, limit, offset]
    );

    const [[{ total }]]: any = await pool.query("SELECT COUNT(*) as total FROM tn_topic_comment WHERE user_id = ?", [
      userId,
    ]);

    res.json({ comments, total });
  } catch (error) {
    console.error(`Error fetching comments for user ${userId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/chats:
 *   get:
 *     tags: [Admin]
 *     summary: 특정 사용자가 보낸 모든 채팅 메시지 조회
 *     description: 특정 사용자가 보낸 모든 채팅 메시지를 최신순으로 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자가 보낸 채팅 메시지 목록
 */
router.get("/users/:userId/chats", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const page = parseInt(req.query.page as string, 10) || 1;
  const offset = (page - 1) * limit;

  try {
    const [messages] = await pool.query(
      `
      SELECT 
        m.id,
        m.content,
        m.created_at,
        m.report_count,
        m.status,
        t.id as topic_id,
        t.display_name as topic_name
      FROM tn_chat m
      JOIN tn_topic t ON m.topic_id = t.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [userId, limit, offset]
    );

    const [[{ total }]]: any = await pool.query("SELECT COUNT(*) as total FROM tn_chat WHERE user_id = ?", [userId]);

    res.json({ messages, total });
  } catch (error) {
    console.error(`Error fetching chat messages for user ${userId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

const ALLOWED_LOG_FILES = [
  "news-server/debug_log.txt",
  "news-server/home_collector_log.txt",
  "news-data/collector.log",
];

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     tags: [Admin]
 *     summary: 사용 가능한 시스템 로그 파일 목록 조회
 *     description: 관리자가 조회할 수 있는 시스템 로그 파일의 목록을 반환합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그 파일 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   path:
 *                     type: string
 */
router.get("/logs", (req: Request, res: Response) => {
  const logFiles = ALLOWED_LOG_FILES.map((filePath) => ({
    name: path.basename(filePath),
    path: filePath,
  }));
  res.json(logFiles);
});

/**
 * @swagger
 * /api/admin/logs/view:
 *   get:
 *     tags: [Admin]
 *     summary: 특정 로그 파일의 내용 조회
 *     description: 지정된 로그 파일의 내용을 텍스트로 반환합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: "조회할 로그 파일의 경로 (e.g., 'news-data/collector.log')"
 *     responses:
 *       200:
 *         description: 로그 파일 내용
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       400:
 *         description: "경로가 지정되지 않음"
 *       403:
 *         description: "허용되지 않은 파일"
 *       404:
 *         description: "파일을 찾을 수 없음"
 */
router.get("/logs/view", (req: Request, res: Response) => {
  const logPath = req.query.path as string;

  if (!logPath) {
    return res.status(400).json({ message: "Log file path is required." });
  }

  if (!ALLOWED_LOG_FILES.includes(logPath)) {
    return res.status(403).json({ message: "Access to this log file is not permitted." });
  }

  const projectRoot = path.resolve(__dirname, "..", "..", "..");
  const absolutePath = path.join(projectRoot, logPath);

  fs.readFile(absolutePath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(404).type("text").send(`Log file not found at: ${logPath}`);
      }
      console.error(`Error reading log file ${logPath}:`, err);
      return res.status(500).type("text").send("Error reading log file.");
    }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(data);
  });
});

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
 *     summary: 모든 발행된 토픽을 최신순으로 조회
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "결과를 제한할 숫자 (예: 5)"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 발행된 토픽 목록
 *       401:
 *         description: 인증 실패
 */
router.get("/topics/published", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10);

  try {
    let sql =
      "SELECT id, display_name, published_at, status FROM tn_topic WHERE status IN ('OPEN', 'PREPARING') AND topic_type = 'VOTING' ORDER BY created_at DESC";
    const params = [];

    if (!isNaN(limit) && limit > 0) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching published topics:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/sidebar:
 *   get:
 *     tags: [Admin]
 *     summary: 사이드바용 토픽 목록 조회
 *     description: "관리자 페이지 사이드바를 위해, OPEN과 PREPARING 상태의 토픽을 최신순으로 반환합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사이드바용 토픽 목록
 */
router.get("/topics/sidebar", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, display_name, status, created_at 
       FROM tn_topic 
       WHERE status IN ('OPEN', 'PREPARING') AND topic_type = 'VOTING' 
       ORDER BY created_at DESC 
       LIMIT 50`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching sidebar topics:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics:
 *   get:
 *     tags: [Admin]
 *     summary: 모든 콘텐츠 토픽 목록을 페이지네이션으로 조회
 *     description: 모든 상태의 콘텐츠 토픽(topic_type = 'CONTENT') 목록을 최신순으로 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: "한 번에 가져올 토픽 수"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "가져올 페이지 번호"
 *     responses:
 *       200:
 *         description: 토픽 목록과 전체 개수
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topics:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 */
router.get("/topics", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const page = parseInt(req.query.page as string, 10) || 1;
  const status = req.query.status as string; // 'OPEN', 'PREPARING', 'CLOSED'
  const offset = (page - 1) * limit;

  let whereClause = "WHERE topic_type = 'VOTING'";
  const params: (string | number)[] = [];
  const countParams: (string | number)[] = [];

  if (status && ["OPEN", "PREPARING", "CLOSED"].includes(status)) {
    whereClause += " AND status = ?";
    params.push(status);
    countParams.push(status);
  }

  params.push(limit, offset);

  try {
    const topicQuery = pool.query(
      `SELECT * FROM tn_topic ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    );
    const totalCountQuery = pool.query(`SELECT COUNT(*) as total FROM tn_topic ${whereClause}`, countParams);

    const allCountQuery = pool.query("SELECT COUNT(*) as total FROM tn_topic WHERE topic_type = 'VOTING'");
    const openCountQuery = pool.query(
      "SELECT COUNT(*) as total FROM tn_topic WHERE topic_type = 'VOTING' AND status = 'OPEN'"
    );
    const preparingCountQuery = pool.query(
      "SELECT COUNT(*) as total FROM tn_topic WHERE topic_type = 'VOTING' AND status = 'PREPARING'"
    );
    const closedCountQuery = pool.query(
      "SELECT COUNT(*) as total FROM tn_topic WHERE topic_type = 'VOTING' AND status = 'CLOSED'"
    );

    const [
      topicResults,
      totalCountResults,
      allCountResults,
      openCountResults,
      preparingCountResults,
      closedCountResults,
    ] = await Promise.all([
      topicQuery,
      totalCountQuery,
      allCountQuery,
      openCountQuery,
      preparingCountQuery,
      closedCountQuery,
    ]);

    const topics = topicResults[0];
    const total = (totalCountResults[0] as any)[0].total;
    const counts = {
      ALL: (allCountResults[0] as any)[0].total,
      OPEN: (openCountResults[0] as any)[0].total,
      PREPARING: (preparingCountResults[0] as any)[0].total,
      CLOSED: (closedCountResults[0] as any)[0].total,
    };

    res.json({ topics, total, counts });
  } catch (error) {
    console.error("Error fetching all topics:", error);
    res.status(500).json({ message: "Server error" });
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
  const { displayName, searchKeywords, summary, stanceLeft, stanceRight } = req.body;

  if (!displayName || !searchKeywords) {
    return res.status(400).json({ message: "Display name and search keywords are required." });
  }

  try {
    const [result]: any = await pool.query(
      "INSERT INTO tn_topic (display_name, embedding_keywords, summary, stance_left, stance_right, status, topic_type, collection_status) VALUES (?, ?, ?, ?, ?, 'PREPARING', 'VOTING', 'pending')",
      [displayName, searchKeywords, summary || "", stanceLeft || "", stanceRight || ""]
    );
    const newTopicId = result.insertId;

    // --- Automatically trigger AI article collection ---
    try {
      const pythonCommand = process.env.PYTHON_EXECUTABLE_PATH || (os.platform() === "win32" ? "python" : "python3");
      const pythonScriptPath = path.join(__dirname, "../../../news-data/topic_matcher_db.py");
      const args = ["-u", pythonScriptPath, String(newTopicId)];

      console.log(`[Topic Create] Executing: ${pythonCommand} ${args.join(" ")}`);
      const pythonProcess = spawn(pythonCommand, args);

      pythonProcess.stdout.on("data", (data) => {
        console.log(`[embedding_processor.py stdout]: ${data.toString().trim()}`);
      });
      pythonProcess.stderr.on("data", (data) => {
        console.error(`[embedding_processor.py stderr]: ${data.toString().trim()}`);
      });
      pythonProcess.on("close", (code) => {
        console.log(`[embedding_processor.py] child process exited with code ${code}`);
      });
    } catch (scriptError) {
      console.error("Failed to start embedding_processor.py script, but topic was created.", scriptError);
      // We don't fail the whole request, just log the error.
      // The admin can manually trigger recollection later.
    }
    // --- End of script execution ---

    res.status(201).json({
      message: `Topic ${newTopicId} has been created and article collection has started.`,
      topicId: newTopicId,
    });
  } catch (error) {
    console.error("Error creating new topic:", error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}:
 *   get:
 *     tags: [Admin]
 *     summary: 특정 토픽의 상세 정보 조회 (관리자용)
 *     description: "관리자가 특정 토픽의 모든 정보를 상태와 관계없이 조회합니다."
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
 *         description: "토픽 상세 정보"
 *       404:
 *         description: "토픽을 찾을 수 없음"
 */
router.get("/topics/:topicId", async (req: Request, res: Response) => {
  const { topicId } = req.params;

  try {
    const [rows]: any = await pool.query("SELECT * FROM tn_topic WHERE id = ?", [topicId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Topic not found." });
    }

    res.json({ topic: rows[0] });
  } catch (error) {
    console.error(`Error fetching topic details for admin (ID ${topicId}):`, error);
    res.status(500).json({ message: "Server error" });
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
  const { left, right, center } = req.body;

  const numericTopicId = parseInt(topicId, 10);
  if (isNaN(numericTopicId)) {
    return res.status(400).json({ message: "Invalid topic ID." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updateSide = async (sideArticles: number[]) => {
      if (!sideArticles || !Array.isArray(sideArticles)) return;
      for (let i = 0; i < sideArticles.length; i++) {
        const articleId = sideArticles[i];
        const displayOrder = i;
        await connection.query("UPDATE tn_article SET display_order = ? WHERE id = ? AND topic_id = ?", [
          displayOrder,
          articleId,
          numericTopicId,
        ]);
      }
    };

    await Promise.all([updateSide(left), updateSide(right), updateSide(center)]);

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
 *               embeddingKeywords:
 *                 type: string
 *                 description: "재수집 시 사용할 새로운 검색 키워드 (선택 사항)"
 *     responses:
 *       200:
 *         description: 재수집 작업 시작됨
 */
router.post("/topics/:topicId/recollect", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const payload = req.body as { embeddingKeywords?: string };
  const normalizedKeywords =
    typeof payload?.embeddingKeywords === "string" ? payload.embeddingKeywords.trim() : undefined;

  try {
    const [rows]: any = await pool.query("SELECT id FROM tn_topic WHERE id = ? AND status = 'OPEN'", [topicId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Published topic not found." });
    }

    if (normalizedKeywords) {
      await pool.query(
        "UPDATE tn_topic SET collection_status = 'pending', embedding_keywords = ?, updated_at = NOW() WHERE id = ?",
        [normalizedKeywords, topicId]
      );
    } else {
      await pool.query("UPDATE tn_topic SET collection_status = 'pending', updated_at = NOW() WHERE id = ?", [topicId]);
    }

    const pythonCommand = process.env.PYTHON_EXECUTABLE_PATH || (os.platform() === "win32" ? "python" : "python3");
    const pythonScriptPath = path.join(__dirname, "../../../news-data/topic_matcher_local.py");
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
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}/collect-ai:
 *   post:
 *     tags: [Admin]
 *     summary: AI 기반 기사 수집 (로컬 실행 안내)
 *     description: "Render 서버 메모리 제한으로 인해, 로컬 환경에서 Python 스크립트를 실행하도록 안내합니다."
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
 *         description: "로컬 실행 안내 메시지 반환"
 *       202:
 *         description: "서버에서 스크립트 실행 시작됨 (ENABLE_AI_COLLECTION=true 인 경우)"
 */
router.post("/topics/:topicId/collect-ai", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const enableAiCollection = process.env.ENABLE_AI_COLLECTION === "true";

  if (!enableAiCollection) {
    return res.status(200).json({
      message: "메모리 제한으로 인해 서버에서 AI 수집을 직접 수행하지 않습니다.",
      instruction: `로컬 터미널에서 다음 명령어를 실행해주세요: python news-data/topic_matcher_db.py ${topicId}`,
      isLocalExecutionRequired: true,
    });
  }

  // 로컬 개발 환경 등에서 강제로 서버 실행을 원하는 경우
  try {
    const pythonCommand = process.env.PYTHON_EXECUTABLE_PATH || (os.platform() === "win32" ? "python" : "python3");
    const pythonScriptPath = path.join(__dirname, "../../../news-data/topic_matcher_db.py");
    const args = ["-u", pythonScriptPath, topicId];

    console.log(`Executing: ${pythonCommand} ${args.join(" ")}`);
    const pythonProcess = spawn(pythonCommand, args);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[embedding_processor stdout]: ${data.toString().trim()}`);
    });
    pythonProcess.stderr.on("data", (data) => {
      console.error(`[embedding_processor stderr]: ${data.toString().trim()}`);
    });

    res.status(202).json({ message: "서버에서 AI 수집 스크립트가 시작되었습니다." });
  } catch (error) {
    console.error("Error starting AI collection:", error);
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

  const appRoot = path.resolve(__dirname, "..", "..");
  // Create an absolute path from the app root and the relative path from DB
  const requestedAbsolutePath = path.join(appRoot, requestedRelativePath);

  // For security, resolve it to a canonical path and check it's within the uploads folder
  const canonicalPath = path.resolve(requestedAbsolutePath);
  const uploadDir = path.resolve(appRoot, "uploads");

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
 * /api/admin/topics/{topicId}/collect-latest:
 *   post:
 *     tags: [Admin]
 *     summary: 특정 토픽에 대해 최신 기사 수집 (키워드 기반)
 *     description: "AI 유사도와 상관없이, 토픽의 키워드와 일치하는 가장 최신 기사 10개를 찾아 '제안' 상태로 추가합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: "기사 제안 성공. 추가된 기사 수를 반환합니다."
 *       404:
 *         description: "토픽을 찾을 수 없음"
 */
/**
 * @swagger
 * /api/admin/topics/{topicId}/collect-latest:
 *   post:
 *     tags: [Admin]
 *     summary: 특정 토픽에 대해 최신 기사 수집 (키워드 기반)
 *     description: "AI 유사도와 상관없이, 토픽의 키워드와 일치하는 가장 최신 기사를 진보/보수 각각 10개씩 찾아 '제안' 상태로 추가합니다. 요청 본문에 키워드를 보내면 해당 키워드를 우선적으로 사용합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               searchKeywords:
 *                 type: string
 *                 description: "임시로 사용할 검색 키워드 (쉼표로 구분)"
 *     responses:
 *       201:
 *         description: "기사 제안 성공. 추가된 기사 수를 반환합니다."
 *       404:
 *         description: "토픽을 찾을 수 없음"
 */
router.post("/topics/:topicId/collect-latest", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const { embeddingKeywords: newKeywords } = req.body || {};
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get topic keywords if new ones are not provided
    let keywords: string[] = [];
    if (newKeywords && typeof newKeywords === "string") {
      keywords = newKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
    } else {
      const [topicRows]: any = await connection.query("SELECT embedding_keywords FROM tn_topic WHERE id = ?", [
        topicId,
      ]);
      if (topicRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "Topic not found." });
      }
      keywords = (topicRows[0].embedding_keywords || "")
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean);
    }

    if (keywords.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Topic has no keywords to search for." });
    }

    // 2. Define sources and prepare queries
    const LEFT_SOURCES = ["경향신문", "한겨레", "오마이뉴스"];
    const RIGHT_SOURCES = ["조선일보", "중앙일보", "동아일보"];
    const CENTER_SOURCES = ["연합뉴스", "뉴시스"];
    const likeClauses = keywords.map(() => `(h.title LIKE ? OR h.description LIKE ?)`).join(" OR ");
    const likeParams = keywords.flatMap((kw: string) => [`%${kw}%`, `%${kw}%`]);

    const createQuery = (sources: string[]) => {
      if (sources.length === 0) return Promise.resolve([[]]); // Return empty result if no sources
      return connection.query(
        `SELECT h.title, h.url, h.source, h.source_domain, h.side, h.published_at, h.description, h.thumbnail_url FROM tn_home_article h
         WHERE h.source IN (?) AND (${likeClauses})
         ORDER BY h.published_at DESC LIMIT 10`,
        [sources, ...likeParams]
      );
    };

    // 3. Run queries in parallel
    const [leftResults, rightResults, centerResults] = await Promise.all([
      createQuery(LEFT_SOURCES),
      createQuery(RIGHT_SOURCES),
      createQuery(CENTER_SOURCES),
    ]);

    const candidateRows = [...(leftResults[0] as any[]), ...(rightResults[0] as any[]), ...(centerResults[0] as any[])];

    if (candidateRows.length === 0) {
      await connection.rollback();
      return res.status(200).json({
        message: "새로운 최신 기사를 찾지 못했습니다.",
        addedCount: 0,
        skippedCount: 0,
        addedArticles: [],
        skippedArticles: [],
      });
    }

    // 4. Get existing article URLs for the topic
    const [existingArticles]: any = await connection.query("SELECT url FROM tn_article WHERE topic_id = ?", [topicId]);
    const existingUrls = new Set(existingArticles.map((a: any) => a.url));

    const articlesToInsert: any[] = [];
    const addedArticlesInfo: { title: string; url: string }[] = [];
    const skippedArticlesInfo: { title: string; url: string }[] = [];

    // Separate candidates into to-be-added and skipped
    for (const candidate of candidateRows) {
      if (existingUrls.has(candidate.url)) {
        skippedArticlesInfo.push({ title: candidate.title, url: candidate.url });
      } else {
        articlesToInsert.push([
          topicId,
          candidate.source,
          candidate.source_domain,
          candidate.side,
          candidate.title,
          candidate.url,
          candidate.published_at,
          candidate.description,
          candidate.thumbnail_url,
          "suggested",
        ]);
        addedArticlesInfo.push({ title: candidate.title, url: candidate.url });
      }
    }

    let addedCount = 0;
    if (articlesToInsert.length > 0) {
      const insertQuery = `
        INSERT INTO tn_article (topic_id, source, source_domain, side, title, url, published_at, rss_desc, thumbnail_url, status)
        VALUES ?
      `;
      const [insertResult]: any = await connection.query(insertQuery, [articlesToInsert]);
      addedCount = insertResult.affectedRows;
    }

    await connection.commit();
    res.status(201).json({
      message: `최신 기사 수집 완료. ${addedCount}개 추가, ${skippedArticlesInfo.length}개 건너뜀.`,
      addedCount: addedCount,
      skippedCount: skippedArticlesInfo.length,
      addedArticles: addedArticlesInfo,
      skippedArticles: skippedArticlesInfo,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error collecting latest articles:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/admin/topics/{topicId}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: 토픽의 상태를 변경 (발행, 반려, 보관 등)
 *     description: "토픽의 상태를 변경합니다. 'OPEN'으로 변경 시 투표 시작/종료 시각이 필요하며, 다른 토픽 정보도 함께 업데이트할 수 있습니다."
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, REJECTED, CLOSED]
 *                 description: "변경할 새로운 상태"
 *               displayName:
 *                 type: string
 *               embeddingKeywords:
 *                 type: string
 *               summary:
 *                 type: string
 *               stanceLeft:
 *                 type: string
 *               stanceRight:
 *                 type: string
 *               vote_start_at:
 *                 type: string
 *                 format: date-time
 *                 description: "상태를 'OPEN'으로 변경 시 필수"
 *               vote_end_at:
 *                 type: string
 *                 format: date-time
 *                 description: "상태를 'OPEN'으로 변경 시 필수"
 *     responses:
 *       200:
 *         description: "상태 변경 성공"
 *       400:
 *         description: "잘못된 요청 (예: 필수 필드 누락)"
 *       404:
 *         description: "토픽을 찾을 수 없거나 상태 변경이 불가능함"
 */
router.patch("/topics/:topicId/status", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const { status, displayName, embeddingKeywords, summary, stanceLeft, stanceRight, vote_start_at, vote_end_at } =
    req.body;

  if (!status || !["OPEN", "REJECTED", "CLOSED"].includes(status)) {
    return res.status(400).json({ message: "A valid status (OPEN, REJECTED, CLOSED) is required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let result: any;
    if (status === "OPEN") {
      if (!vote_start_at || !vote_end_at || !displayName || !embeddingKeywords) {
        return res.status(400).json({ message: "To publish, vote times, display name, and keywords are required." });
      }
      [result] = await connection.query(
        "UPDATE tn_topic SET status = 'OPEN', display_name = ?, embedding_keywords = ?, summary = ?, stance_left = ?, stance_right = ?, vote_start_at = ?, vote_end_at = ?, published_at = NOW() WHERE id = ? AND status = 'PREPARING'",
        [displayName, embeddingKeywords, summary, stanceLeft, stanceRight, vote_start_at, vote_end_at, topicId]
      );
    } else if (status === "REJECTED") {
      [result] = await connection.query(
        "UPDATE tn_topic SET status = 'REJECTED' WHERE id = ? AND status = 'PREPARING'",
        [topicId]
      );
    } else if (status === "CLOSED") {
      [result] = await connection.query("UPDATE tn_topic SET status = 'CLOSED' WHERE id = ? AND status = 'OPEN'", [
        topicId,
      ]);
    }

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Topic not found or status transition is not allowed (e.g., already published)." });
    }

    await connection.commit();
    res.json({ message: `Topic ${topicId} status has been updated to ${status}.` });
  } catch (error) {
    await connection.rollback();
    console.error(`Error updating topic ${topicId} status:`, error);
    res.status(500).json({ message: "Server error", detail: (error as Error).message });
  } finally {
    connection.release();
  }
});

// dummy comment to trigger restart
export default router;
