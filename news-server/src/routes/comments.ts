import express, { Request, Response } from "express";
import pool from "../config/db";
import { authenticateUser, AuthenticatedRequest } from "../middleware/userAuth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: 기사 댓글 관리
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id: { type: integer, description: "댓글 ID" }
 *         content: { type: string, description: "댓글 내용" }
 *         parent_comment_id: { type: integer, nullable: true, description: "부모 댓글 ID (대댓글인 경우)" }
 *         created_at: { type: string, format: date-time, description: "작성 시간" }
 *         updated_at: { type: string, format: date-time, description: "마지막 수정 시간" }
 *         status: { type: string, enum: ['ACTIVE', 'DELETED_BY_USER', 'DELETED_BY_ADMIN'], description: "댓글 상태" }
 *         user_id: { type: integer, description: "작성자 ID" }
 *         nickname: { type: string, description: "작성자 닉네임" }
 *         profile_image_url: { type: string, nullable: true, description: "작성자 프로필 이미지 URL" }
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *           description: "대댓글 목록"
 */

/**
 * @swagger
 * /api/articles/{articleId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: 특정 기사의 댓글 목록 조회 (대댓글 포함)
 *     description: "특정 기사에 달린 모든 댓글과 대댓글을 계층 구조로 조회합니다. 삭제된 댓글은 '삭제된 댓글입니다.'로 표시됩니다."
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "댓글을 조회할 기사의 ID"
 *     responses:
 *       200:
 *         description: "댓글 목록 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: "서버 오류"
 */
router.get("/articles/:articleId/comments", async (req: Request, res: Response) => {
  const { articleId } = req.params;

  try {
    const [comments]: any = await pool.query(
      `
      SELECT
        c.id,
        c.content,
        c.parent_comment_id,
        c.created_at,
        c.updated_at,
        c.status,
        u.id as user_id,
        u.nickname,
        u.profile_image_url
      FROM
        tn_article_comment c
      JOIN
        tn_user u ON c.user_id = u.id
      WHERE
        c.article_id = ?
      ORDER BY
        c.created_at ASC
    `,
      [articleId]
    );

    // Hide content of deleted comments
    const processedComments = comments.map((comment: any) => {
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const absoluteProfileImageUrl = comment.profile_image_url
            ? `${baseUrl}${comment.profile_image_url}`
            : null;

        if (comment.status !== 'ACTIVE') {
            return {
                ...comment,
                content: '삭제된 댓글입니다.',
                nickname: '(알수없음)',
                profile_image_url: null,
            };
        }
        return {
            ...comment,
            profile_image_url: absoluteProfileImageUrl,
        };
    });

    // Build the nested structure
    const commentMap = new Map();
    const topLevelComments: any[] = [];

    processedComments.forEach((comment: any) => {
      comment.replies = [];
      commentMap.set(comment.id, comment);

      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(comment);
        } else {
          // In case parent comes later in the list (shouldn't happen with ORDER BY)
          topLevelComments.push(comment);
        }
      } else {
        topLevelComments.push(comment);
      }
    });

    res.json(topLevelComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "댓글을 불러오는 중 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/articles/{articleId}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: 새 댓글 또는 대댓글 작성
 *     description: "특정 기사에 새 댓글을 작성하거나, 기존 댓글에 대댓글을 작성합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "댓글을 작성할 기사의 ID"
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
 *                 description: "댓글 내용"
 *               parent_comment_id:
 *                 type: integer
 *                 nullable: true
 *                 description: "대댓글인 경우 부모 댓글의 ID"
 *     responses:
 *       201:
 *         description: "댓글 작성 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 content: { type: string }
 *                 parent_comment_id: { type: integer, nullable: true }
 *                 created_at: { type: string, format: date-time }
 *                 nickname: { type: string }
 *                 profile_image_url: { type: string, nullable: true }
 *       400:
 *         description: "유효하지 않은 요청 (내용 누락 등)"
 *       401:
 *         description: "인증 실패"
 *       500:
 *         description: "서버 오류"
 */
router.post("/articles/:articleId/comments", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { articleId } = req.params;
  const userId = req.user?.userId;
  const { content, parent_comment_id } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: "댓글 내용이 비어있습니다." });
  }

  try {
    // Prevent replies to replies (limit depth to 1)
    if (parent_comment_id) {
      const [parentCommentRows]: any = await pool.query(
        "SELECT parent_comment_id FROM tn_article_comment WHERE id = ?",
        [parent_comment_id]
      );
      if (parentCommentRows.length === 0) {
        return res.status(400).json({ message: "부모 댓글을 찾을 수 없습니다." });
      }
      if (parentCommentRows[0].parent_comment_id !== null) {
        return res.status(400).json({ message: "대댓글에는 답글을 달 수 없습니다." });
      }
    }

    const [result]: any = await pool.query(
      "INSERT INTO tn_article_comment (article_id, user_id, content, parent_comment_id) VALUES (?, ?, ?, ?)",
      [articleId, userId, content, parent_comment_id || null]
    );

    const [newCommentRaw]: any = await pool.query(
        `
        SELECT c.id, c.content, c.parent_comment_id, c.created_at, u.nickname, u.profile_image_url
        FROM tn_article_comment c
        JOIN tn_user u ON c.user_id = u.id
        WHERE c.id = ?
        `, [result.insertId]
    );

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const newComment = {
        ...newCommentRaw[0],
        profile_image_url: newCommentRaw[0].profile_image_url
            ? `${baseUrl}${newCommentRaw[0].profile_image_url}`
            : null,
    };

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ message: "댓글을 작성하는 중 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   patch:
 *     tags: [Comments]
 *     summary: 댓글 수정
 *     description: "자신이 작성한 댓글의 내용을 수정합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "수정할 댓글의 ID"
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
 *                 description: "수정할 댓글 내용"
 *     responses:
 *       200:
 *         description: "댓글 수정 성공"
 *       400:
 *         description: "유효하지 않은 요청 (내용 누락 등)"
 *       401:
 *         description: "인증 실패"
 *       403:
 *         description: "수정 권한 없음"
 *       404:
 *         description: "댓글을 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */
router.patch("/comments/:commentId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;
    const userId = req.user?.userId;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "댓글 내용이 비어있습니다." });
    }

    try {
        const [commentRows]: any = await pool.query("SELECT user_id FROM tn_article_comment WHERE id = ?", [commentId]);
        if (commentRows.length === 0) {
            return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
        }
        if (commentRows[0].user_id !== userId) {
            return res.status(403).json({ message: "댓글을 수정할 권한이 없습니다." });
        }

        await pool.query("UPDATE tn_article_comment SET content = ? WHERE id = ?", [content, commentId]);
        res.status(200).json({ message: "댓글이 성공적으로 수정되었습니다." });
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ message: "댓글을 수정하는 중 오류가 발생했습니다." });
    }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     tags: [Comments]
 *     summary: 댓글 삭제
 *     description: "자신이 작성한 댓글을 삭제합니다. 대댓글이 있는 댓글은 내용이 '삭제된 댓글입니다.'로 변경되고, 대댓글이 없는 댓글은 상태만 'DELETED_BY_USER'로 변경됩니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "삭제할 댓글의 ID"
 *     responses:
 *       200:
 *         description: "댓글 삭제 성공"
 *       401:
 *         description: "인증 실패"
 *       403:
 *         description: "삭제 권한 없음"
 *       404:
 *         description: "댓글을 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */
router.delete("/comments/:commentId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;
    const userId = req.user?.userId;

    try {
        const [commentRows]: any = await pool.query("SELECT user_id FROM tn_article_comment WHERE id = ?", [commentId]);
        if (commentRows.length === 0) {
            return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
        }
        if (commentRows[0].user_id !== userId) {
            return res.status(403).json({ message: "댓글을 삭제할 권한이 없습니다." });
        }

        // Check if the comment has replies
        const [replyRows]: any = await pool.query("SELECT id FROM tn_article_comment WHERE parent_comment_id = ?", [commentId]);

        if (replyRows.length > 0) {
            // If there are replies, just change the content to 'deleted'
            await pool.query("UPDATE tn_article_comment SET content = '삭제된 댓글입니다.', status = 'DELETED_BY_USER' WHERE id = ?", [commentId]);
        } else {
            // If no replies, delete it completely (or just change status, for consistency let's just change status)
            await pool.query("UPDATE tn_article_comment SET status = 'DELETED_BY_USER' WHERE id = ?", [commentId]);
        }

        res.status(200).json({ message: "댓글이 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "댓글을 삭제하는 중 오류가 발생했습니다." });
    }
});


export default router;