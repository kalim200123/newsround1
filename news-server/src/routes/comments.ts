import express, { Request, Response } from "express";
import pool from "../config/db";
import { AuthenticatedRequest, authenticateUser, optionalAuthenticateUser } from "../middleware/userAuth";

const router = express.Router();

// Helper function to get absolute avatar URL
const getAbsoluteAvatarUrl = (avatarUrl: string | null, req: Request): string | null => {
  if (avatarUrl && !avatarUrl.startsWith("http")) {
    return `${req.protocol}://${req.get("host")}${avatarUrl}`;
  }
  return avatarUrl;
};

/**
 * @swagger
 * /api/articles/{articleId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: 기사에 대한 댓글 목록 조회
 *     description: "특정 기사에 대한 댓글 목록을 정렬 옵션과 함께 조회합니다. 대댓글은 부모 댓글 내에 중첩된 형태로 반환되며, 삭제된 댓글은 합계에서 제외됩니다. 로그인한 경우, 현재 사용자의 좋아요/싫어요 반응도 함께 반환됩니다."
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "댓글을 조회할 기사의 ID"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *           default: newest
 *         description: "댓글 정렬 순서 (최신순, 과거순)"
 *     responses:
 *       200:
 *         description: "댓글 목록과 전체 활성 댓글 수"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       content: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                       parent_comment_id: { type: integer, nullable: true }
 *                       status: { type: string, enum: [ACTIVE, HIDDEN, DELETED_BY_USER, DELETED_BY_ADMIN] }
 *                       user_id: { type: integer }
 *                       nickname: { type: string }
 *                       avatar_url: { type: string, nullable: true }
 *                       like_count: { type: integer }
 *                       dislike_count: { type: integer }
 *                       currentUserReaction: { type: string, enum: [LIKE, DISLIKE], nullable: true }
 *                       replies:
 *                         type: array
 *                         items:
 *                           type: object
 *                 totalCount:
 *                   type: integer
 *                   description: "삭제되지 않은 댓글 및 대댓글의 총 개수"
 */
router.get(
  "/articles/:articleId/comments",
  optionalAuthenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("[GET-Comments-Debug] Handler started. req.user:", req.user);
    const { articleId } = req.params;
    const { sort = "newest" } = req.query;
    const currentUserId = req.user?.userId;

    let orderByClause = "ORDER BY c.created_at DESC";
    if (sort === "oldest") {
      orderByClause = "ORDER BY c.created_at ASC";
    }

    try {
      const query = `
      SELECT 
        c.id, c.content, c.created_at, c.parent_comment_id, c.status,
        c.like_count, c.dislike_count,
        u.id as user_id, u.nickname, u.profile_image_url,
        r.reaction_type as currentUserReaction
      FROM tn_article_comment c
      JOIN tn_user u ON c.user_id = u.id
      LEFT JOIN tn_article_comment_reaction r ON c.id = r.comment_id AND r.user_id = ?
      WHERE c.article_id = ?
      ${orderByClause}
    `;
      const [commentsRows]: any = await pool.query(query, [currentUserId, articleId]);

      const [totalCountRows]: any = await pool.query(
        "SELECT COUNT(*) as total FROM tn_article_comment WHERE article_id = ? AND status = 'ACTIVE'",
        [articleId]
      );
      const totalCount = totalCountRows[0].total;

      const comments = commentsRows.map((comment: any) => ({
        ...comment,
        avatar_url: getAbsoluteAvatarUrl(comment.profile_image_url, req),
      }));

      const commentMap: { [key: number]: any } = {};
      const nestedComments: any[] = [];

      comments.forEach((comment: any) => {
        comment.replies = [];
        commentMap[comment.id] = comment;
      });

      comments.forEach((comment: any) => {
        if (comment.parent_comment_id) {
          if (commentMap[comment.parent_comment_id]) {
            commentMap[comment.parent_comment_id].replies.push(comment);
          }
        } else {
          nestedComments.push(comment);
        }
      });

      // 모든 대댓글(replies) 배열을 오래된 순으로 정렬하는 재귀 함수
      const sortRepliesRecursively = (commentList: any[]) => {
        commentList.forEach((comment) => {
          if (comment.replies && comment.replies.length > 0) {
            comment.replies.sort(
              (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            sortRepliesRecursively(comment.replies); // 재귀 호출
          }
        });
      };

      // 최상위 댓글 목록과 그 아래 모든 대댓글들을 오래된 순으로 정렬
      sortRepliesRecursively(nestedComments);

      // 최상위 댓글 목록만 요청된 정렬 순서에 따라 정렬
      if (sort === "newest") {
        nestedComments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sort === "oldest") {
        nestedComments.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }

      res.status(200).json({ comments: nestedComments, totalCount });
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "댓글을 불러오는 중 오류가 발생했습니다." });
    }
  }
);

/**
 * @swagger
 * /api/articles/{articleId}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: 새 댓글 또는 대댓글 작성
 *     description: "특정 기사에 새 댓글을 작성하거나, 기존 댓글에 대댓글을 작성합니다. 대댓글에 대한 답글도 가능하며, 프론트엔드에서 최상위 부모 댓글 ID를 parent_comment_id로 전달해야 합니다."
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
 *               parent_comment_id:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       201:
 *         description: "댓글 작성 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 comment:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     content: { type: string }
 *                     created_at: { type: string, format: date-time }
 *                     parent_comment_id: { type: integer, nullable: true }
 *                     status: { type: string, enum: [ACTIVE, HIDDEN, DELETED_BY_USER, DELETED_BY_ADMIN] }
 *                     user_id: { type: integer }
 *                     nickname: { type: string }
 *                     avatar_url: { type: string, nullable: true }
 *                     like_count: { type: integer }
 *                     dislike_count: { type: integer }
 */
router.post("/articles/:articleId/comments", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { articleId } = req.params;
  const userId = req.user!.userId;
  const { content, parent_comment_id } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: "댓글 내용이 비어있습니다." });
  }

  try {
    if (parent_comment_id) {
      const [parentCommentRows]: any = await pool.query(
        "SELECT id FROM tn_article_comment WHERE id = ?", // Just check if parent exists
        [parent_comment_id]
      );
      if (parentCommentRows.length === 0) {
        return res.status(400).json({ message: "부모 댓글을 찾을 수 없습니다." });
      }
    }

    const [result]: any = await pool.query(
      "INSERT INTO tn_article_comment (article_id, user_id, content, parent_comment_id) VALUES (?, ?, ?, ?)",
      [articleId, userId, content, parent_comment_id || null]
    );

    const [newCommentRows]: any = await pool.query(
      `
      SELECT 
        c.id, c.content, c.created_at, c.parent_comment_id, c.status,
        c.like_count, c.dislike_count,
        u.id as user_id, u.nickname, u.profile_image_url
      FROM tn_article_comment c
      JOIN tn_user u ON c.user_id = u.id
      WHERE c.id = ?
      `,
      [result.insertId]
    );

    const newComment = {
      ...newCommentRows[0],
      avatar_url: getAbsoluteAvatarUrl(newCommentRows[0].profile_image_url, req),
    };

    res.status(201).json({ message: "댓글이 성공적으로 작성되었습니다.", comment: newComment });
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ message: "댓글 작성 중 오류가 발생했습니다." });
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
 *     responses:
 *       200:
 *         description: "댓글 수정 성공"
 */
router.patch("/comments/:commentId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.userId;
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
 *     description: "자신이 작성한 댓글을 삭제합니다. 대댓글이 있는 댓글은 내용이 '삭제된 댓글입니다.'로 변경되고, 대댓글이 없는 댓글은 DB에서 삭제됩니다."
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
 */
router.delete("/comments/:commentId", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.userId;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [commentRows]: any = await connection.query("SELECT user_id FROM tn_article_comment WHERE id = ?", [
      commentId,
    ]);
    if (commentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }
    if (commentRows[0].user_id !== userId) {
      await connection.rollback();
      return res.status(403).json({ message: "댓글을 삭제할 권한이 없습니다." });
    }

    const [replyRows]: any = await connection.query(
      "SELECT id FROM tn_article_comment WHERE parent_comment_id = ? LIMIT 1",
      [commentId]
    );

    if (replyRows.length > 0) {
      // Soft delete
      await connection.query(
        "UPDATE tn_article_comment SET status = 'DELETED_BY_USER', content = '삭제된 댓글입니다.' WHERE id = ?",
        [commentId]
      );
    } else {
      // Hard delete
      await connection.query("DELETE FROM tn_article_comment WHERE id = ?", [commentId]);
    }

    await connection.commit();
    res.status(200).json({ message: "댓글이 성공적으로 삭제되었습니다." });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "댓글 삭제 중 오류가 발생했습니다." });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/comments/{commentId}/react:
 *   post:
 *     tags: [Comments]
 *     summary: 댓글에 대한 반응(좋아요/싫어요) 추가/변경/삭제
 *     description: "특정 댓글에 대해 좋아요 또는 싫어요를 누릅니다. 이미 같은 반응을 누른 경우 취소되고, 다른 반응을 누른 경우 변경됩니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "반응할 댓글의 ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reaction]
 *             properties:
 *               reaction:
 *                 type: string
 *                 enum: [LIKE, DISLIKE]
 *                 description: "사용자의 반응"
 *     responses:
 *       200:
 *         description: "반응이 성공적으로 처리되었습니다."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 like_count: { type: integer }
 *                 dislike_count: { type: integer }
 *                 currentUserReaction: { type: string, enum: [LIKE, DISLIKE], nullable: true }
 */
router.post("/comments/:commentId/react", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.userId;
  const { reaction: newReaction } = req.body;

  if (newReaction !== "LIKE" && newReaction !== "DISLIKE") {
    return res.status(400).json({ message: "Invalid reaction type." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingReactions]: any = await connection.query(
      "SELECT reaction_type FROM tn_article_comment_reaction WHERE user_id = ? AND comment_id = ?",
      [userId, commentId]
    );

    const existingReaction = existingReactions.length > 0 ? existingReactions[0].reaction_type : null;

    let likeIncrement = 0;
    let dislikeIncrement = 0;

    if (!existingReaction) {
      // New reaction
      await connection.query(
        "INSERT INTO tn_article_comment_reaction (user_id, comment_id, reaction_type) VALUES (?, ?, ?)",
        [userId, commentId, newReaction]
      );
      if (newReaction === "LIKE") likeIncrement = 1;
      else dislikeIncrement = 1;
    } else if (existingReaction !== newReaction) {
      // Change reaction
      await connection.query(
        "UPDATE tn_article_comment_reaction SET reaction_type = ? WHERE user_id = ? AND comment_id = ?",
        [newReaction, userId, commentId]
      );
      if (newReaction === "LIKE") {
        likeIncrement = 1;
        dislikeIncrement = -1;
      } else {
        likeIncrement = -1;
        dislikeIncrement = 1;
      }
    }
    // If existingReaction is the same as newReaction, do nothing.

    // Update counts on the comment table
    if (likeIncrement !== 0 || dislikeIncrement !== 0) {
      await connection.query(
        "UPDATE tn_article_comment SET like_count = like_count + ?, dislike_count = dislike_count + ? WHERE id = ?",
        [likeIncrement, dislikeIncrement, commentId]
      );
    }

    // Get the final counts and the user's current reaction
    const [finalState]: any = await connection.query(
      `SELECT 
        c.like_count, 
        c.dislike_count, 
        r.reaction_type as currentUserReaction
      FROM tn_article_comment c
      LEFT JOIN tn_article_comment_reaction r ON c.id = r.comment_id AND r.user_id = ?
      WHERE c.id = ?`,
      [userId, commentId]
    );

    await connection.commit();

    res.status(200).json({
      like_count: finalState[0].like_count,
      dislike_count: finalState[0].dislike_count,
      currentUserReaction: finalState[0].currentUserReaction || null,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error processing comment reaction:", error);
    res.status(500).json({ message: "댓글 반응 처리 중 오류가 발생했습니다." });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/comments/{commentId}/react:
 *   delete:
 *     tags: [Comments]
 *     summary: 댓글에 대한 반응(좋아요/싫어요) 취소
 *     description: "사용자가 특정 댓글에 대해 눌렀던 반응을 취소합니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "반응을 취소할 댓글의 ID"
 *     responses:
 *       200:
 *         description: "반응 취소가 성공적으로 처리되었습니다."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 like_count: { type: integer }
 *                 dislike_count: { type: integer }
 *                 currentUserReaction: { type: 'null' }
 */
router.delete("/comments/:commentId/react", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.userId;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Find the existing reaction to determine whether to decrement like or dislike count
    const [existingReactions]: any = await connection.query(
      "SELECT reaction_type FROM tn_article_comment_reaction WHERE user_id = ? AND comment_id = ?",
      [userId, commentId]
    );

    if (existingReactions.length > 0) {
      const existingReaction = existingReactions[0].reaction_type;
      let likeIncrement = 0;
      let dislikeIncrement = 0;

      if (existingReaction === "LIKE") {
        likeIncrement = -1;
      } else if (existingReaction === "DISLIKE") {
        dislikeIncrement = -1;
      }

      // Delete the reaction
      await connection.query("DELETE FROM tn_article_comment_reaction WHERE user_id = ? AND comment_id = ?", [
        userId,
        commentId,
      ]);

      // Update the counts
      if (likeIncrement !== 0 || dislikeIncrement !== 0) {
        await connection.query(
          "UPDATE tn_article_comment SET like_count = like_count + ?, dislike_count = dislike_count + ? WHERE id = ?",
          [likeIncrement, dislikeIncrement, commentId]
        );
      }
    }
    // If no reaction exists, do nothing but proceed to return the final counts.

    // Get the final counts
    const [finalCounts]: any = await connection.query(
      "SELECT like_count, dislike_count FROM tn_article_comment WHERE id = ?",
      [commentId]
    );

    await connection.commit();

    res.status(200).json({
      ...finalCounts[0],
      currentUserReaction: null,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error processing comment reaction cancellation:", error);
    res.status(500).json({ message: "댓글 반응 취소 처리 중 오류가 발생했습니다." });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/comments/{commentId}/report:
 *   post:
 *     tags: [Comments]
 *     summary: 댓글 신고
 *     description: "특정 댓글을 신고합니다. 한 사용자는 같은 댓글을 한 번만 신고할 수 있습니다."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "신고할 댓글의 ID"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: "신고 사유 (선택 사항)"
 *     responses:
 *       200:
 *         description: "신고가 성공적으로 접수되었습니다."
 *       409:
 *         description: "이미 신고한 댓글입니다."
 */
router.post("/comments/:commentId/report", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.userId;
  const { reason } = req.body;
  const REPORT_THRESHOLD = 5;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if the user has already reported this comment
    const [existingReports]: any = await connection.query(
      "SELECT id FROM tn_article_comment_report_log WHERE user_id = ? AND comment_id = ?",
      [userId, commentId]
    );

    if (existingReports.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "이미 신고한 댓글입니다." });
    }

    // Log the report
    await connection.query("INSERT INTO tn_article_comment_report_log (user_id, comment_id, reason) VALUES (?, ?, ?)", [
      userId,
      commentId,
      reason || null,
    ]);

    // Increment the report count on the comment table
    await connection.query("UPDATE tn_article_comment SET report_count = report_count + 1 WHERE id = ?", [commentId]);

    // Check if the report count reached the threshold
    const [comments]: any = await connection.query(
      "SELECT user_id, report_count FROM tn_article_comment WHERE id = ?",
      [commentId]
    );

    if (comments.length > 0 && comments[0].report_count >= REPORT_THRESHOLD) {
      const commentAuthorId = comments[0].user_id;

      // Hide the comment
      await connection.query(
        "UPDATE tn_article_comment SET status = 'HIDDEN', content = '신고 누적으로 숨김 처리된 댓글입니다.' WHERE id = ?",
        [commentId]
      );

      // Warn the author
      await connection.query("UPDATE tn_user SET warning_count = warning_count + 1 WHERE id = ?", [commentAuthorId]);
    }

    await connection.commit();

    res.status(200).json({ message: "신고가 성공적으로 접수되었습니다." });
  } catch (error) {
    await connection.rollback();
    console.error("Error processing comment report:", error);
    res.status(500).json({ message: "댓글 신고 처리 중 오류가 발생했습니다." });
  } finally {
    connection.release();
  }
});

export default router;
