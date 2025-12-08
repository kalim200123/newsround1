import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { Pool } from 'mysql2/promise';

import { DB_CONNECTION_POOL } from '../database/database.constants';

@Injectable()
export class CommentsService {
  constructor(@Inject(DB_CONNECTION_POOL) private dbPool: Pool) {}

  async getComments(
    topicId: number,
    userId?: number,
    baseUrl?: string,
  ): Promise<any> {
    try {
      const [rows]: any = await this.dbPool.query(
        `
        SELECT
          c.id, c.parent_comment_id, c.content, c.created_at, c.updated_at,
          c.like_count, c.dislike_count, c.user_vote_side,
          u.id AS user_id, u.nickname, u.profile_image_url,
          r.reaction_type as my_reaction,
          IF(c.user_id = ?, true, false) AS is_mine
        FROM tn_topic_comment c
        JOIN tn_user u ON c.user_id = u.id
        LEFT JOIN tn_topic_comment_reaction r ON c.id = r.comment_id AND r.user_id = ?
        WHERE c.topic_id = ? AND c.status = 'ACTIVE'
        ORDER BY c.created_at ASC
        `,
        [userId, userId, topicId],
      );

      const commentMap = new Map();
      const rootComments: any[] = [];

      rows.forEach((comment: any) => {
        // Convert to absolute URL if needed
        if (
          comment.profile_image_url &&
          comment.profile_image_url.startsWith('/') &&
          baseUrl
        ) {
          comment.profile_image_url = `${baseUrl}${comment.profile_image_url}`;
        }

        comment.replies = [];
        comment.is_mine = Boolean(comment.is_mine);
        commentMap.set(comment.id, comment);

        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies.push(comment);
          } else {
            rootComments.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      return rootComments;
    } catch (error) {
      console.error(`Error fetching comments for topic ${topicId}:`, error);
      throw new InternalServerErrorException('Server error');
    }
  }

  async createComment(
    topicId: number,
    userId: number,
    content: string,
    parentCommentId?: number,
    userVoteSide?: string,
  ): Promise<any> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('댓글 내용을 입력해주세요.');
    }
    if (!userVoteSide || !['LEFT', 'RIGHT'].includes(userVoteSide)) {
      throw new BadRequestException('투표 성향이 올바르지 않습니다.');
    }

    try {
      const [result]: any = await this.dbPool.query(
        "INSERT INTO tn_topic_comment (topic_id, user_id, content, parent_comment_id, user_vote_side, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')",
        [topicId, userId, content, parentCommentId || null, userVoteSide],
      );

      return {
        id: result.insertId,
        message: '댓글이 작성되었습니다.',
      };
    } catch (error) {
      console.error(`Error creating comment for topic ${topicId}:`, error);
      throw new InternalServerErrorException('Server error');
    }
  }

  async deleteComment(commentId: number, userId: number): Promise<any> {
    const connection = await this.dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [comment]: any = await connection.query(
        'SELECT user_id FROM tn_topic_comment WHERE id = ?',
        [commentId],
      );

      if (comment.length === 0) {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      }

      if (comment[0].user_id !== userId) {
        throw new ForbiddenException('자신의 댓글만 삭제할 수 있습니다.');
      }

      await connection.query(
        "UPDATE tn_topic_comment SET status = 'DELETED_BY_USER', content = '삭제된 댓글입니다.' WHERE id = ?",
        [commentId],
      );

      await connection.commit();
      return { message: '댓글이 삭제되었습니다.' };
    } catch (error) {
      await connection.rollback();
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error(`Error deleting comment ${commentId}:`, error);
      throw new InternalServerErrorException('Server error');
    } finally {
      connection.release();
    }
  }

  async updateComment(
    commentId: number,
    userId: number,
    content: string,
  ): Promise<any> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('수정할 내용을 입력해주세요.');
    }

    try {
      const [result]: any = await this.dbPool.query(
        'UPDATE tn_topic_comment SET content = ? WHERE id = ? AND user_id = ? AND status = "ACTIVE"',
        [content, commentId, userId],
      );

      if (result.affectedRows === 0) {
        throw new NotFoundException(
          '댓글을 찾을 수 없거나 수정 권한이 없습니다.',
        );
      }

      return { message: '댓글이 수정되었습니다.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(`Error updating comment ${commentId}:`, error);
      throw new InternalServerErrorException('Server error');
    }
  }

  async toggleReaction(
    commentId: number,
    userId: number,
    reactionType: 'LIKE' | 'DISLIKE',
  ): Promise<any> {
    const connection = await this.dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [existing]: any = await connection.query(
        'SELECT reaction_type FROM tn_topic_comment_reaction WHERE user_id = ? AND comment_id = ?',
        [userId, commentId],
      );

      let likeChange = 0;
      let dislikeChange = 0;

      if (existing.length > 0) {
        const oldReaction = existing[0].reaction_type;
        if (oldReaction === reactionType) {
          await connection.rollback();
          return { message: 'Reaction unchanged' };
        }
        // Switch reaction
        if (oldReaction === 'LIKE') likeChange = -1;
        if (oldReaction === 'DISLIKE') dislikeChange = -1;
        if (reactionType === 'LIKE') likeChange = 1;
        if (reactionType === 'DISLIKE') dislikeChange = 1;

        await connection.query(
          'UPDATE tn_topic_comment_reaction SET reaction_type = ? WHERE user_id = ? AND comment_id = ?',
          [reactionType, userId, commentId],
        );
      } else {
        // New reaction
        if (reactionType === 'LIKE') likeChange = 1;
        if (reactionType === 'DISLIKE') dislikeChange = 1;

        await connection.query(
          'INSERT INTO tn_topic_comment_reaction (user_id, comment_id, reaction_type) VALUES (?, ?, ?)',
          [userId, commentId, reactionType],
        );
      }

      await connection.query(
        'UPDATE tn_topic_comment SET like_count = like_count + ?, dislike_count = dislike_count + ? WHERE id = ?',
        [likeChange, dislikeChange, commentId],
      );

      await connection.commit();
      return { message: 'Reaction saved' };
    } catch (error) {
      await connection.rollback();
      console.error(`Error toggling reaction for comment ${commentId}:`, error);
      throw new InternalServerErrorException('Server error');
    } finally {
      connection.release();
    }
  }

  async reportComment(
    commentId: number,
    userId: number,
    reason: string,
  ): Promise<any> {
    const connection = await this.dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [alreadyReported]: any = await connection.query(
        'SELECT id FROM tn_topic_comment_report_log WHERE user_id = ? AND comment_id = ?',
        [userId, commentId],
      );

      if (alreadyReported.length > 0) {
        await connection.rollback();
        throw new ConflictException('이미 신고한 댓글입니다.');
      }

      await connection.query(
        'INSERT INTO tn_topic_comment_report_log (user_id, comment_id, reason) VALUES (?, ?, ?)',
        [userId, commentId, reason],
      );

      await connection.query(
        'UPDATE tn_topic_comment SET report_count = report_count + 1 WHERE id = ?',
        [commentId],
      );

      await connection.commit();
      return { message: '신고가 접수되었습니다.' };
    } catch (error) {
      await connection.rollback();
      if (error instanceof ConflictException) throw error;
      console.error(`Error reporting comment ${commentId}:`, error);
      throw new InternalServerErrorException('Server error');
    } finally {
      connection.release();
    }
  }
}
