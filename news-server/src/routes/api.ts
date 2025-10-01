import { Request, Response, Router } from "express";
import pool from "../config/db";
import { authenticateUser, AuthenticatedRequest } from "../middleware/userAuth";

const router = Router();

// GET /api/topics - 전체 토픽 목록 조회
router.get("/topics", async (req: Request, res: Response) => {
  try {
    // [수정] core_keyword 대신 display_name을 선택합니다.
    const [rows] = await pool.query(
      "SELECT id, display_name, summary, published_at FROM tn_topic WHERE status = 'published' ORDER BY published_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/topics/:topicId - 특정 토픽 상세 정보 조회
router.get("/topics/:topicId", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    // [수정] 필요한 컬럼(display_name, summary 등)만 명시적으로 선택합니다.
    const [topicRows]: any = await pool.query(
      "SELECT id, display_name, summary, published_at FROM tn_topic WHERE id = ? AND status = 'published'",
      [topicId]
    );
    const [articleRows] = await pool.query(
      "SELECT id, source, source_domain, side, title, url, published_at, is_featured, thumbnail_url FROM tn_article WHERE topic_id = ? AND status = 'published' ORDER BY `display_order` ASC",
      [topicId]
    );

    if (topicRows.length === 0) {
      return res.status(404).json({ message: "Topic not found" });
    }
    const responseData = {
      topic: topicRows[0],
      articles: articleRows,
    };
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/topics/:topicId/comments - 특정 토픽의 댓글 목록 조회
router.get("/topics/:topicId/comments", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    const [comments]: any = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.nickname 
       FROM tn_comment c
       JOIN tn_user u ON c.user_id = u.id
       WHERE c.topic_id = ? 
       ORDER BY c.created_at DESC`,
      [topicId]
    );
    res.json(comments);
  } catch (error) {
    console.error(`Error fetching comments for topic ${topicId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/topics/:topicId/comments - 특정 토픽에 새 댓글 작성 (인증 필요)
router.post("/topics/:topicId/comments", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { topicId } = req.params;
  const { content } = req.body;
  const userId = req.user?.userId;

  if (!content) {
    return res.status(400).json({ message: "Comment content is required." });
  }

  try {
    const [result]: any = await pool.query(
      "INSERT INTO tn_comment (topic_id, user_id, content) VALUES (?, ?, ?)",
      [topicId, userId, content]
    );

    // Fetch the newly created comment to return it
    const [newComment]: any = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.nickname 
       FROM tn_comment c
       JOIN tn_user u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error(`Error posting comment for topic ${topicId}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
