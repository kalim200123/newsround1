// src/routes/comments.ts

import express, { Response } from "express";
import pool from "../config/db";
import { AuthenticatedRequest, authenticateUser, optionalAuthenticateUser } from "../middleware/userAuth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TopicComments
 *   description: 토픽(ROUND2) 댓글 관련 API
 */

/**
 * @swagger
 * /api/comments/topics/{topicId}:
 *   get:
 *     tags: [TopicComments]
 *     summary: 특정 토픽의 댓글 목록 조회
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 댓글 목록
 */
router.get("/comments/topics/:topicId", optionalAuthenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { topicId } = req.params;
  const userId = req.user?.userId;

  try {
    const [comments]: any = await pool.query(
      `
      SELECT 
        c.id, c.parent_comment_id, c.content, c.created_at, c.updated_at,
        c.like_count, c.dislike_count, c.user_vote_side,
        u.id as user_id, u.nickname, u.profile_image_url,
        r.reaction_type as my_reaction
      FROM tn_topic_comment c
      JOIN tn_user u ON c.user_id = u.id
      LEFT JOIN tn_topic_comment_reaction r ON c.id = r.comment_id AND r.user_id = ?
      WHERE c.topic_id = ? AND c.status = 'ACTIVE'
      ORDER BY c.created_at ASC
    `,
      [userId, topicId]
    );

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Build a tree structure for comments
    const commentMap = new Map();
    const rootComments: any[] = [];

    comments.forEach((comment: any) => {
      // Convert profile_image_url to absolute URL
      if (comment.profile_image_url) {
        comment.profile_image_url = `${baseUrl}${comment.profile_image_url}`;
      }

      comment.replies = [];
      commentMap.set(comment.id, comment);
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(comment);
        } else {
          rootComments.push(comment); // Parent might appear later in the list
        }
      } else {
        rootComments.push(comment);
      }
    });

    res.json(rootComments);
  } catch (error) {
    console.error("Error fetching topic comments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/comments/topics/{topicId}:
 *   post:
 *     tags: [TopicComments]
 *     summary: 특정 토픽에 새 댓글 작성
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, parentCommentId, userVoteSide]
 *             properties:
 *               content:
 *                 type: string
 *               parentCommentId:
 *                 type: integer
 *                 nullable: true
 *               userVoteSide:
 *                 type: string
 *                 enum: [LEFT, RIGHT]
 *     responses:
 *       201:
 *         description: 댓글 작성 성공
 */
router.post("/comments/topics/:topicId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { topicId } = req.params;
  const userId = req.user?.userId;
  const { content, parentCommentId, userVoteSide } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Content is required." });
  }

  if (!["LEFT", "RIGHT"].includes(userVoteSide)) {
    return res.status(400).json({ message: "userVoteSide must be either 'LEFT' or 'RIGHT'." });
  }

  try {
    const [result]: any = await pool.query(
      "INSERT INTO tn_topic_comment (topic_id, user_id, content, parent_comment_id, user_vote_side) VALUES (?, ?, ?, ?, ?)",
      [topicId, userId, content, parentCommentId || null, userVoteSide]
    );
    res.status(201).json({ message: "Comment created", commentId: result.insertId });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   patch:
 *     tags: [TopicComments]
 *     summary: 내 댓글 수정
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: 댓글 수정 성공
 */
router.patch("/:commentId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user?.userId;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Content is required." });
  }

  try {
    const [result]: any = await pool.query("UPDATE tn_topic_comment SET content = ? WHERE id = ? AND user_id = ?", [
      content,
      commentId,
      userId,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Comment not found or you don't have permission to edit it." });
    }
    res.status(200).json({ message: "Comment updated" });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     tags: [TopicComments]
 *     summary: 내 댓글 삭제
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 댓글 삭제 성공
 */
router.delete("/:commentId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user?.userId;

  try {
    const [result]: any = await pool.query(
      "UPDATE tn_topic_comment SET status = 'DELETED_BY_USER', content = '삭제된 댓글입니다.' WHERE id = ? AND user_id = ?",
      [commentId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Comment not found or you don't have permission to delete it." });
    }
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/comments/{commentId}/reactions:
 *   post:
 *     tags: [TopicComments]
 *     summary: 댓글에 반응(좋아요/싫어요) 추가/변경
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reactionType]
 *             properties:
 *               reactionType: { type: string, enum: [LIKE, DISLIKE] }
 *     responses:
 *       200:
 *         description: 반응 처리 성공
 */
router.post("/:commentId/reactions", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user?.userId;
  const { reactionType } = req.body;

  if (!["LIKE", "DISLIKE"].includes(reactionType)) {
    return res.status(400).json({ message: "Invalid reaction type." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing]: any = await connection.query(
      "SELECT reaction_type FROM tn_topic_comment_reaction WHERE user_id = ? AND comment_id = ?",
      [userId, commentId]
    );

    let likeChange = 0;
    let dislikeChange = 0;

    if (existing.length > 0) {
      const oldReaction = existing[0].reaction_type;
      if (oldReaction === reactionType) {
        // Same reaction, do nothing
        await connection.rollback();
        return res.status(200).json({ message: "Reaction unchanged." });
      }
      // Switch reaction
      if (oldReaction === "LIKE") likeChange = -1;
      if (oldReaction === "DISLIKE") dislikeChange = -1;
      if (reactionType === "LIKE") likeChange = 1;
      if (reactionType === "DISLIKE") dislikeChange = 1;
      await connection.query(
        "UPDATE tn_topic_comment_reaction SET reaction_type = ? WHERE user_id = ? AND comment_id = ?",
        [reactionType, userId, commentId]
      );
    } else {
      // New reaction
      if (reactionType === "LIKE") likeChange = 1;
      if (reactionType === "DISLIKE") dislikeChange = 1;
      await connection.query(
        "INSERT INTO tn_topic_comment_reaction (user_id, comment_id, reaction_type) VALUES (?, ?, ?)",
        [userId, commentId, reactionType]
      );
    }

    await connection.query(
      "UPDATE tn_topic_comment SET like_count = like_count + ?, dislike_count = dislike_count + ? WHERE id = ?",
      [likeChange, dislikeChange, commentId]
    );

    await connection.commit();
    res.status(200).json({ message: "Reaction saved." });
  } catch (error) {
    await connection.rollback();
    console.error("Error saving reaction:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/comments/{commentId}/reports:
 *   post:
 *     tags: [TopicComments]
 *     summary: 댓글 신고
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       201:
 *         description: 신고 접수 성공
 */
router.post("/:commentId/reports", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user?.userId;
  const { reason } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [alreadyReported]: any = await connection.query(
      "SELECT id FROM tn_topic_comment_report_log WHERE user_id = ? AND comment_id = ?",
      [userId, commentId]
    );

    if (alreadyReported.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "You have already reported this comment." });
    }

    await connection.query("INSERT INTO tn_topic_comment_report_log (user_id, comment_id, reason) VALUES (?, ?, ?)", [
      userId,
      commentId,
      reason,
    ]);

    await connection.query("UPDATE tn_topic_comment SET report_count = report_count + 1 WHERE id = ?", [commentId]);

    await connection.commit();
    res.status(201).json({ message: "Comment reported successfully." });
  } catch (error) {
    await connection.rollback();
    console.error("Error reporting comment:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
});

export default router;
