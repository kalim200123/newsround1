import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { DB_CONNECTION_POOL } from '../../database/database.constants';

@Injectable()
export class AdminInquiriesService {
  constructor(@Inject(DB_CONNECTION_POOL) private readonly dbPool: Pool) {}

  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT i.*, u.email, u.nickname 
      FROM tn_inquiry i
      LEFT JOIN tn_user u ON i.user_id = u.id
      ORDER BY i.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const countQuery = 'SELECT COUNT(*) as total FROM tn_inquiry';

    const [rows]: any = await this.dbPool.query(query, [limit, offset]);
    const [countRows]: any = await this.dbPool.query(countQuery);

    return {
      inquiries: rows,
      total: countRows[0].total,
      page,
      limit,
    };
  }

  async findOne(inquiryId: number) {
    const queryInquiry = `
      SELECT i.*, u.email as user_email, u.nickname as user_nickname 
      FROM tn_inquiry i
      LEFT JOIN tn_user u ON i.user_id = u.id
      WHERE i.id = ?
    `;
    const [inquiryRows]: any = await this.dbPool.query(queryInquiry, [
      inquiryId,
    ]);

    if (inquiryRows.length === 0) {
      throw new NotFoundException('문의를 찾을 수 없습니다.');
    }

    const inquiry = inquiryRows[0];

    const queryReply = `
      SELECT id, content, created_at 
      FROM tn_inquiry_reply 
      WHERE inquiry_id = ?
    `;
    const [replyRows]: any = await this.dbPool.query(queryReply, [inquiryId]);

    const reply = replyRows.length > 0 ? replyRows[0] : null;

    return { inquiry, reply };
  }

  async reply(inquiryId: number, content: string, adminUsername: string) {
    const connection = await this.dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [inquiryRows]: any = await connection.query(
        'SELECT id FROM tn_inquiry WHERE id = ?',
        [inquiryId],
      );

      if (inquiryRows.length === 0) {
        throw new NotFoundException('문의를 찾을 수 없습니다.');
      }

      await connection.query(
        'INSERT INTO tn_inquiry_reply (inquiry_id, admin_username, content) VALUES (?, ?, ?)',
        [inquiryId, adminUsername, content],
      );

      await connection.query(
        "UPDATE tn_inquiry SET status = 'RESOLVED', updated_at = NOW() WHERE id = ?",
        [inquiryId],
      );

      await connection.commit();
      return { message: '답변이 등록되었습니다.' };
    } catch (error) {
      await connection.rollback();
      console.error('Error replying to inquiry:', error);
      throw new InternalServerErrorException(
        '답변 등록 중 오류가 발생했습니다.',
      );
    } finally {
      connection.release();
    }
  }
}
