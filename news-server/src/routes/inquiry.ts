import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../config/db";
import { authenticateUser, AuthenticatedRequest } from "../middleware/userAuth";

import { validateInquiry } from "../middleware/inquiryValidation";

const router = express.Router();

// Multer 설정: 파일 업로드 처리
const uploadDir = "uploads/inquiries";
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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, Buffer.from(file.originalname, 'latin1').toString('utf8') + '-' + uniqueSuffix + path.extname(file.originalname));
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


  try {
    await pool.query(
      "INSERT INTO tn_inquiry (user_id, subject, content, file_path, privacy_agreement) VALUES (?, ?, ?, ?, ?)",
      [userId, subject, content, filePath, true]
    );
    res.status(201).json({ message: "문의가 성공적으로 제출되었습니다." });
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    res.status(500).json({ message: "문의를 제출하는 중 오류가 발생했습니다." });
  }
});

export default router;
