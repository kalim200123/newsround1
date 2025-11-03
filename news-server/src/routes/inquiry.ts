import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../config/db";
import { authenticateUser, AuthenticatedRequest } from "../middleware/userAuth";

import { validateInquiry } from "../middleware/inquiryValidation";

const router = express.Router();

// Multer 설정: 파일 업로드 처리
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'inquiries');
// 서버 시작 시 업로드 폴더가 없으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 파일 이름 중복을 피하기 위해 타임스탬프 추가
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, basename + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 파일 사이즈 제한
});

/**
 * @swagger
 * /api/inquiry:
 *   post:
 *     tags:
 *       - Inquiry
 *     summary: 사용자 문의 제출
 *     description: "로그인한 사용자가 주제, 내용, (선택적)첨부파일을 포함하여 문의를 제출합니다."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [subject, content, privacy_agreement]
 *             properties:
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               privacy_agreement:
 *                 type: string
 *                 description: "개인정보 수집 및 동의 여부 (true여야 함)"
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: "첨부 파일 (최대 5MB)"
 *     responses:
 *       201:
 *         description: "문의가 성공적으로 제출되었습니다."
 *       400:
 *         description: "필수 입력값 누락 또는 유효성 검사 실패"
 *       401:
 *         description: "인증 실패"
 */
router.post("/", authenticateUser, upload.single('attachment'), validateInquiry, async (req: AuthenticatedRequest, res: Response) => {
  const { subject, content } = req.body;
  const userId = req.user?.userId;
  const filePath = req.file ? req.file.path : null;
  const originalName = req.file ? Buffer.from(req.file.originalname, 'latin1').toString('utf8') : null;

  console.log('[Debug] Attempting to save inquiry with file info:', {
    filePath,
    originalName,
    hasFile: !!req.file
  });

  try {
    await pool.query(
      "INSERT INTO tn_inquiry (user_id, subject, content, file_path, privacy_agreement, file_originalname) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, subject, content, filePath, true, originalName]
    );
    res.status(201).json({ message: "문의가 성공적으로 제출되었습니다." });
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    res.status(500).json({ message: "문의를 제출하는 중 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/inquiry:
 *   get:
 *     tags:
 *       - Inquiry
 *     summary: 내 문의 내역 목록 조회
 *     description: "로그인한 사용자가 자신이 작성한 모든 문의 내역의 목록을 조회합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "사용자의 문의 내역 목록"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   subject:
 *                     type: string
 *                   status:
 *                     type: string
 *                     description: "답변 상태 (예: PENDING, REPLIED, RESOLVED)"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: "인증 실패"
 */
router.get("/", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const [inquiries] = await pool.query(
      "SELECT id, subject, status, created_at FROM tn_inquiry WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.status(200).json(inquiries);
  } catch (error) {
    console.error("Error fetching user inquiries:", error);
    res.status(500).json({ message: "문의 내역을 조회하는 중 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/inquiry/{inquiryId}:
 *   get:
 *     tags:
 *       - Inquiry
 *     summary: 내 특정 문의 상세 조회
 *     description: "로그인한 사용자가 자신이 작성한 특정 문의의 상세 내용과 관리자의 답변을 함께 조회합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "조회할 문의의 ID"
 *     responses:
 *       200:
 *         description: "문의 상세 내용 및 답변"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inquiry:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     subject:
 *                       type: string
 *                     content:
 *                       type: string
 *                     file_path:
 *                       type: string
 *                     file_originalname:
 *                       type: string
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                 reply:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                     content:
 *                       type: string
 *                     created_at:
 *                       type: string
 *       401:
 *         description: "인증 실패"
 *       404:
 *         description: "문의를 찾을 수 없거나 다른 사용자의 문의입니다."
 */
router.get("/:inquiryId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { inquiryId } = req.params;
  const userId = req.user?.userId;

  try {
    // 1. 문의 원본 내용 조회 (본인 확인 포함)
    const [inquiryRows]: any = await pool.query(
      "SELECT id, subject, content, file_path, file_originalname, status, created_at FROM tn_inquiry WHERE id = ? AND user_id = ?",
      [inquiryId, userId]
    );

    if (inquiryRows.length === 0) {
      return res.status(404).json({ message: "문의를 찾을 수 없거나 접근 권한이 없습니다." });
    }

    // 2. 답변 내용 조회
    const [replyRows]: any = await pool.query(
        "SELECT id, content, created_at FROM tn_inquiry_reply WHERE inquiry_id = ?",
        [inquiryId]
    );

    res.status(200).json({
      inquiry: inquiryRows[0],
      reply: replyRows.length > 0 ? replyRows[0] : null,
    });
  } catch (error) {
    console.error(`Error fetching inquiry details for ID ${inquiryId}:`, error);
    res.status(500).json({ message: "문의 상세 내역을 조회하는 중 오류가 발생했습니다." });
  }
});

export default router;
