import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { DB_CONNECTION_POOL } from '../../database/database.constants';
import { CreateKeywordDto, UpdateKeywordDto } from './dto/keyword.dto';

@Injectable()
export class AdminKeywordsService {
  constructor(@Inject(DB_CONNECTION_POOL) private readonly dbPool: Pool) {}

  async findAll() {
    const [rows]: any = await this.dbPool.query(
      'SELECT * FROM tn_trending_keyword ORDER BY id DESC',
    );
    return { keywords: rows };
  }

  async create(dto: CreateKeywordDto) {
    const { keyword } = dto;
    try {
      await this.dbPool.query(
        'INSERT INTO tn_trending_keyword (keyword) VALUES (?)',
        [keyword],
      );
      return { message: '키워드가 추가되었습니다.' };
    } catch (error) {
      console.error('Error creating keyword:', error);
      throw new InternalServerErrorException(
        '키워드 추가 중 오류가 발생했습니다.',
      );
    }
  }

  async update(id: number, dto: UpdateKeywordDto) {
    const { keyword } = dto;
    try {
      const [result]: any = await this.dbPool.query(
        'UPDATE tn_trending_keyword SET keyword = ? WHERE id = ?',
        [keyword, id],
      );

      if (result.affectedRows === 0) {
        throw new NotFoundException('키워드를 찾을 수 없습니다.');
      }

      return { message: '키워드가 수정되었습니다.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error updating keyword:', error);
      throw new InternalServerErrorException(
        '키워드 수정 중 오류가 발생했습니다.',
      );
    }
  }

  async delete(id: number) {
    try {
      const [result]: any = await this.dbPool.query(
        'DELETE FROM tn_trending_keyword WHERE id = ?',
        [id],
      );

      if (result.affectedRows === 0) {
        throw new NotFoundException('키워드를 찾을 수 없습니다.');
      }

      return { message: '키워드가 삭제되었습니다.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error deleting keyword:', error);
      throw new InternalServerErrorException(
        '키워드 삭제 중 오류가 발생했습니다.',
      );
    }
  }
}
