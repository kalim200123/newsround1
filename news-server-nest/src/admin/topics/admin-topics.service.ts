import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import type { Pool } from 'mysql2/promise';
import * as path from 'path';
import { DB_CONNECTION_POOL } from '../../database/database.constants';
import { NotificationType } from '../../notifications/dto/send-notification.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { CollectLatestDto } from './dto/collect-latest.dto';
import { CreateTopicDto, TopicType } from './dto/create-topic.dto';
import { UpdateArticleOrderDto } from './dto/update-article-order.dto';
import {
  TopicStatus,
  UpdateTopicStatusDto,
} from './dto/update-topic-status.dto';

@Injectable()
export class AdminTopicsService {
  private readonly logger = new Logger(AdminTopicsService.name);

  constructor(
    @Inject(DB_CONNECTION_POOL) private readonly dbPool: Pool,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(page: number, limit: number, status?: string, search?: string) {
    const offset = (page - 1) * limit;
    let query =
      'SELECT id, display_name, status, created_at, published_at, vote_end_at, stance_left, stance_right FROM tn_topic';
    let countQuery = 'SELECT COUNT(*) as total FROM tn_topic';
    const params: any[] = [];

    const conditions: string[] = [];

    // Always filter by VOTING type
    conditions.push('topic_type = ?');
    params.push('VOTING');

    if (status && status !== 'ALL') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(display_name LIKE ? OR embedding_keywords LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Count query params should match the WHERE clause params only
    const countParams = params.slice(0, params.length - 2);

    const [rows]: any = await this.dbPool.query(query, params);
    const [countRows]: any = await this.dbPool.query(countQuery, countParams);

    // Calculate counts for each status (only VOTING topics)
    const [statusCounts]: any = await this.dbPool.query(
      'SELECT status, COUNT(*) as count FROM tn_topic WHERE topic_type = ? GROUP BY status',
      ['VOTING'],
    );

    const counts = {
      ALL: 0,
      OPEN: 0,
      PREPARING: 0,
      CLOSED: 0,
    };

    statusCounts.forEach((row: any) => {
      counts[row.status] = row.count;
      counts.ALL += row.count;
    });

    return {
      topics: rows,
      total: countRows[0].total,
      counts,
      page,
      limit,
    };
  }

  async findOne(topicId: number) {
    const [rows]: any = await this.dbPool.query(
      'SELECT * FROM tn_topic WHERE id = ?',
      [topicId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('토픽을 찾을 수 없습니다.');
    }

    return { topic: rows[0] };
  }

  async create(dto: CreateTopicDto) {
    const {
      displayName,
      searchKeywords,
      summary,
      stanceLeft,
      stanceRight,
      topicType = TopicType.VOTING,
    } = dto;

    const connection = await this.dbPool.getConnection();
    try {
      await connection.beginTransaction();

      const [result]: any = await connection.query(
        `INSERT INTO tn_topic 
         (display_name, embedding_keywords, summary, stance_left, stance_right, topic_type, status, collection_status) 
         VALUES (?, ?, ?, ?, ?, ?, 'PREPARING', 'pending')`,
        [
          displayName,
          searchKeywords,
          summary,
          stanceLeft,
          stanceRight,
          topicType,
        ],
      );

      const topicId = result.insertId;
      await connection.commit();

      // Trigger Python script
      this.runPythonScript('topic_matcher_db.py', [String(topicId)]);

      return { message: '토픽이 생성되었습니다.', topicId };
    } catch (error) {
      await connection.rollback();
      this.logger.error('Error creating topic:', error);
      throw new InternalServerErrorException(
        '토픽 생성 중 오류가 발생했습니다.',
      );
    } finally {
      connection.release();
    }
  }

  async updateStatus(topicId: number, dto: UpdateTopicStatusDto) {
    const { status } = dto;
    const connection = await this.dbPool.getConnection();

    try {
      await connection.beginTransaction();

      const [topicRows]: any = await connection.query(
        'SELECT title, status FROM tn_topic WHERE id = ?',
        [topicId],
      );

      if (topicRows.length === 0) {
        throw new NotFoundException('토픽을 찾을 수 없습니다.');
      }

      const topic = topicRows[0];
      const oldStatus = topic.status;

      await connection.query('UPDATE tn_topic SET status = ? WHERE id = ?', [
        status,
        topicId,
      ]);

      if (
        status === TopicStatus.PUBLISHED &&
        oldStatus !== TopicStatus.PUBLISHED
      ) {
        await connection.query(
          'UPDATE tn_topic SET published_at = NOW() WHERE id = ?',
          [topicId],
        );

        // Send notification
        await this.notificationsService.sendNotificationToAll(
          NotificationType.NEW_TOPIC,
          {
            id: topicId,
            title: topic.title,
          },
        );
      }

      await connection.commit();
      return { message: '토픽 상태가 변경되었습니다.' };
    } catch (error) {
      await connection.rollback();
      this.logger.error('Error updating topic status:', error);
      throw new InternalServerErrorException(
        '토픽 상태 변경 중 오류가 발생했습니다.',
      );
    } finally {
      connection.release();
    }
  }

  async recollect(topicId: number) {
    // Trigger topic_recollector.py
    this.runPythonScript('topic_recollector.py', [String(topicId)]);
    return { message: '기사 재수집이 시작되었습니다.' };
  }

  async collectAi(topicId: number) {
    const enableAiCollection =
      this.configService.get<string>('ENABLE_AI_COLLECTION') === 'true';

    if (!enableAiCollection) {
      return {
        message:
          'AI 수집 기능이 비활성화되어 있습니다. 로컬에서 vector_indexer.py를 실행하세요.',
        command: `python news-data/vector_indexer.py --topic_id ${topicId}`,
      };
    }

    this.runPythonScript('vector_indexer.py', ['--topic_id', String(topicId)]);
    return { message: 'AI 기반 기사 수집이 시작되었습니다.' };
  }

  async collectLatest(topicId: number, dto: CollectLatestDto) {
    const { keywords } = dto;
    const keywordList = keywords.split(',').map((k) => k.trim());

    if (keywordList.length === 0) {
      throw new BadRequestException('키워드를 입력해주세요.');
    }

    const conditions = keywordList
      .map(() => '(title LIKE ? OR summary LIKE ?)')
      .join(' OR ');
    const params = keywordList.flatMap((k) => [`%${k}%`, `%${k}%`]);

    const [articles]: any = await this.dbPool.query(
      `SELECT * FROM tn_home_article WHERE ${conditions} ORDER BY published_at DESC LIMIT 50`,
      params,
    );

    let addedCount = 0;
    for (const article of articles) {
      const [existing]: any = await this.dbPool.query(
        'SELECT id FROM tn_article WHERE url = ? AND topic_id = ?',
        [article.url, topicId],
      );

      if (existing.length === 0) {
        await this.dbPool.query(
          `INSERT INTO tn_article 
           (topic_id, title, url, summary, published_at, source, source_domain, thumbnail_url, status, side)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'suggested', 'NEUTRAL')`,
          [
            topicId,
            article.title,
            article.url,
            article.summary,
            article.published_at,
            article.source,
            article.source_domain,
            article.thumbnail_url,
          ],
        );
        addedCount++;
      }
    }

    return { message: `${addedCount}개의 최신 기사가 수집되었습니다.` };
  }

  async unpublishAllArticles(topicId: number) {
    await this.dbPool.query(
      "UPDATE tn_article SET status = 'suggested' WHERE topic_id = ? AND status = 'published'",
      [topicId],
    );
    return { message: '모든 기사가 발행 취소되었습니다.' };
  }

  async deleteAllSuggested(topicId: number) {
    await this.dbPool.query(
      "UPDATE tn_article SET status = 'deleted' WHERE topic_id = ? AND status = 'suggested'",
      [topicId],
    );
    return { message: '모든 추천 기사가 삭제되었습니다.' };
  }

  async getArticles(topicId: number) {
    const [rows]: any = await this.dbPool.query(
      'SELECT * FROM tn_article WHERE topic_id = ? AND status != "deleted" ORDER BY display_order ASC, published_at DESC',
      [topicId],
    );
    return rows;
  }

  async updateArticleOrder(topicId: number, dto: UpdateArticleOrderDto) {
    const { articleIds } = dto;
    const connection = await this.dbPool.getConnection();

    try {
      await connection.beginTransaction();
      for (let i = 0; i < articleIds.length; i++) {
        await connection.query(
          'UPDATE tn_article SET display_order = ? WHERE id = ? AND topic_id = ?',
          [i + 1, articleIds[i], topicId],
        );
      }
      await connection.commit();
      return { message: '기사 순서가 저장되었습니다.' };
    } catch (error) {
      await connection.rollback();
      this.logger.error('Error updating article order:', error);
      throw new InternalServerErrorException(
        '기사 순서 저장 중 오류가 발생했습니다.',
      );
    } finally {
      connection.release();
    }
  }

  async deleteArticle(articleId: number) {
    await this.dbPool.query(
      "UPDATE tn_article SET status = 'deleted' WHERE id = ?",
      [articleId],
    );
    return { message: '기사가 삭제되었습니다.' };
  }

  async publishArticle(articleId: number) {
    await this.dbPool.query(
      "UPDATE tn_article SET status = 'published' WHERE id = ?",
      [articleId],
    );
    return { message: '기사가 발행되었습니다.' };
  }

  async unpublishArticle(articleId: number) {
    await this.dbPool.query(
      "UPDATE tn_article SET status = 'suggested' WHERE id = ?",
      [articleId],
    );
    return { message: '기사가 발행 취소되었습니다.' };
  }

  async getVoteStatistics(topicId: number) {
    // Get topic details
    const [topicRows]: any = await this.dbPool.query(
      `SELECT id, display_name, vote_start_at, vote_end_at, status, stance_left, stance_right 
       FROM tn_topic WHERE id = ?`,
      [topicId],
    );

    if (topicRows.length === 0) {
      throw new NotFoundException('토픽을 찾을 수 없습니다.');
    }

    const topic = topicRows[0];

    // Get vote statistics
    const [leftVotes]: any = await this.dbPool.query(
      "SELECT COUNT(*) as count FROM tn_topic_vote WHERE topic_id = ? AND side = 'LEFT'",
      [topicId],
    );

    const [rightVotes]: any = await this.dbPool.query(
      "SELECT COUNT(*) as count FROM tn_topic_vote WHERE topic_id = ? AND side = 'RIGHT'",
      [topicId],
    );

    const leftCount = leftVotes[0].count;
    const rightCount = rightVotes[0].count;
    const totalVotes = leftCount + rightCount;

    const leftPercentage =
      totalVotes > 0 ? Math.round((leftCount / totalVotes) * 100) : 0;
    const rightPercentage = totalVotes > 0 ? 100 - leftPercentage : 0;

    // Get voters with user information
    const [voters]: any = await this.dbPool.query(
      `SELECT tv.id, tv.side, tv.created_at, tv.user_id,
              u.nickname, u.email
       FROM tn_topic_vote tv
       JOIN tn_user u ON tv.user_id = u.id
       WHERE tv.topic_id = ?
       ORDER BY tv.created_at DESC`,
      [topicId],
    );

    const formattedVoters = voters.map((v: any) => ({
      id: v.id,
      side: v.side,
      created_at: v.created_at,
      user: {
        id: v.user_id,
        nickname: v.nickname,
        email: v.email,
      },
    }));

    return {
      topic,
      statistics: {
        total_votes: totalVotes,
        left_votes: leftCount,
        right_votes: rightCount,
        left_percentage: leftPercentage,
        right_percentage: rightPercentage,
      },
      voters: formattedVoters,
    };
  }

  private runPythonScript(scriptName: string, args: string[]) {
    const pythonPath =
      this.configService.get<string>('PYTHON_EXECUTABLE_PATH') || 'python3';

    // Assuming news-data is a sibling of news-server-nest
    // Current: src/admin/topics/admin-topics.service.ts
    // Root: news-server-nest
    // Script: ../news-data/script.py

    // We need to resolve the path relative to the project root.
    // However, in production/build, the structure might differ.
    // Let's assume we run from project root and news-data is at ../news-data

    // Better approach: Use absolute path if possible or relative to process.cwd()
    // If process.cwd() is news-server-nest, then news-data is ../news-data

    const scriptPath = path.resolve(process.cwd(), '../news-data', scriptName);

    this.logger.log(
      `Executing Python script: ${pythonPath} ${scriptPath} ${args.join(' ')}`,
    );

    const pythonProcess = spawn(pythonPath, [scriptPath, ...args]);

    pythonProcess.stdout.on('data', (data) => {
      this.logger.log(`[${scriptName}] ${data.toString()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      this.logger.error(`[${scriptName}] ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
      this.logger.log(`[${scriptName}] process exited with code ${code}`);
    });
  }
}
