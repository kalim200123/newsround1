/*
import express from "express";
import { pool } from "../config/db";
import { userAuth } from "../middleware/userAuth";

const router = express.Router({ mergeParams: true });

// GET comments for a topic
router.get("/", async (req, res) => {
  const { topicId } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT c.id, c.content, c.created_at, u.nickname
      FROM tn_comment c
      JOIN tn_user u ON c.user_id = u.id
      WHERE c.topic_id = ? AND c.status = 'ACTIVE'
      ORDER BY c.created_at DESC
    `,
      [topicId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "댓글을 불러오는 중 오류가 발생했습니다." });
  }
});

// POST a new comment
router.post("/", userAuth, async (req, res) => {
  const { topicId } = req.params;
  const { content } = req.body;
  const userId = req.user?.id;

  if (!content) {
    return res.status(400).json({ message: "댓글 내용이 필요합니다." });
  }

  if (!userId) {
    return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
  }

  try {
    const [result] = await pool.execute("INSERT INTO tn_comment (topic_id, user_id, content) VALUES (?, ?, ?)", [
      topicId,
      userId,
      content,
    ]);

    const [rows] = await pool.query(
      `
        SELECT c.id, c.content, c.created_at, u.nickname
        FROM tn_comment c
        JOIN tn_user u ON c.user_id = u.id
        WHERE c.id = ?
    `,
      [(result as any).insertId]
    );

    res.status(201).json((rows as any)[0]);
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ message: "댓글을 작성하는 중 오류가 발생했습니다." });
  }
});

export default router;
*/
