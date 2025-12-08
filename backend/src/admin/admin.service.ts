import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Pool } from 'mysql2/promise';
import * as path from 'path';
import { ChatGateway } from '../chat/chat.gateway';
import { DB_CONNECTION_POOL } from '../database/database.constants';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminNotificationDto } from './dto/admin-notification.dto';

@Injectable()
export class AdminService {
  private s3Client: S3Client;

  constructor(
    @Inject(DB_CONNECTION_POOL) private readonly dbPool: Pool,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
    private readonly chatGateway: ChatGateway,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        )!,
      },
    });
  }

  async login(loginDto: AdminLoginDto) {
    const { username, password } = loginDto;
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminPasswordHash = this.configService.get<string>(
      'ADMIN_PASSWORD_HASH',
    );

    if (!adminUsername) {
      throw new Error('Admin credentials are not configured.');
    }

    if (username !== adminUsername) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    let passwordValid = false;
    if (adminPasswordHash) {
      passwordValid = await bcrypt.compare(password, adminPasswordHash);
    } else if (adminPassword) {
      passwordValid = password === adminPassword;
    }

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = { sub: username, role: 'admin' };
    const token = this.jwtService.sign(payload);

    return { token };
  }

  async getStats() {
    const queries = [
      this.dbPool.query(
        "SELECT COUNT(*) as count FROM tn_topic WHERE status = 'OPEN' AND topic_type = 'VOTING'",
      ),
      this.dbPool.query('SELECT COUNT(*) as count FROM tn_inquiry'),
      this.dbPool.query(
        "SELECT COUNT(*) as count FROM tn_inquiry WHERE status = 'SUBMITTED'",
      ),
      this.dbPool.query('SELECT COUNT(*) as count FROM tn_user'),
      this.dbPool.query(
        'SELECT COUNT(*) as count FROM tn_user WHERE created_at >= CURDATE()',
      ),
    ];

    const results = await Promise.all(queries);

    return {
      topics: {
        published: (results[0][0] as any)[0].count,
      },
      inquiries: {
        total: (results[1][0] as any)[0].count,
        pending: (results[2][0] as any)[0].count,
      },
      users: {
        total: (results[3][0] as any)[0].count,
        today: (results[4][0] as any)[0].count,
      },
    };
  }

  async getWeeklyVisitors() {
    const [rows]: any = await this.dbPool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(DISTINCT user_identifier) as visitors
      FROM
        tn_visitor_log
      WHERE
        created_at >= CURDATE() - INTERVAL 6 DAY
      GROUP BY
        date
      ORDER BY
        date ASC;
    `);

    const visitorMap = new Map<string, number>(
      rows.map((row: any) => [row.date, row.visitors]),
    );
    const weeklyData: { date: string; visitors: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];

      weeklyData.push({
        date: dateString,
        visitors: visitorMap.get(dateString) || 0,
      });
    }

    return weeklyData;
  }

  async getDownloadUrl(s3Key: string) {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME is not configured.');
    }

    const [inquiryRows]: any = await this.dbPool.query(
      'SELECT file_originalname FROM tn_inquiry WHERE file_path = ?',
      [s3Key],
    );

    if (inquiryRows.length === 0) {
      throw new NotFoundException('해당 경로의 문의 파일을 찾을 수 없습니다.');
    }

    const originalName =
      inquiryRows[0].file_originalname || path.basename(s3Key);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalName)}"`,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
    return { url };
  }

  async sendNotification(dto: AdminNotificationDto) {
    const { user_id, message, related_url, type } = dto;
    const params = { message, url: related_url };

    if (user_id) {
      return this.notificationsService.sendNotificationToUser(
        user_id,
        type!,
        params,
      );
    } else {
      return this.notificationsService.sendNotificationToAll(type!, params);
    }
  }
}
