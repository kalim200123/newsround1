import { exec } from "child_process";
import { Request, Response, Router } from "express";
import path from "path";
import pool from "../config/db";
import { authenticateAdmin, handleAdminLogin } from "../middleware/auth";

const router = Router();

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
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
 *     summary: '제안됨' 상태의 토픽 후보 목록 조회
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
 *     summary: '발행됨' 상태의 모든 토픽 목록 조회
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
 *     description: 토픽을 생성하고, 상태를 'published'로, 수집 상태를 'pending'으로 설정합니다. 이 API는 백그라운드에서 파이썬 기사 수집 스크립트를 트리거합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               searchKeywords:
 *                 type: string
 *               summary:
 *                 type: string
 *     responses:
 *       201:
 *         description: 토픽 생성 및 발행 성공
 *       400:
 *         description: 필수 필드 누락
 */
router.post("/topics", async (req: Request, res: Response) => {
  // ... (기존 코드와 동일)
});

// ... (이하 다른 모든 API에 대해 유사한 주석 추가)

export default router;