import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { DB_CONNECTION_POOL } from '../../database/database.constants';

@Injectable()
export class VisitorLoggerMiddleware implements NestMiddleware {
  constructor(@Inject(DB_CONNECTION_POOL) private readonly conn: Pool) {}

  // In-memory cache to prevent race conditions and reduce DB queries
  private dailyVisitors = new Set<string>();
  private lastClearDate = new Date().toDateString();

  async use(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent'] || '';
    // Handle proxy headers (taking the first IP if multiple)
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const ip = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : req.socket.remoteAddress || '';

    const path = req.originalUrl;

    // Asynchronously log without blocking the request
    this.logVisitor(ip, userAgent, path).catch((err) => {
      console.error('[VisitorLogger] Failed to log visitor:', err);
    });

    next();
  }

  private async logVisitor(ip: string, userAgent: string, path: string) {
    try {
      // 1. Check Date and Reset Cache if needed
      const today = new Date().toDateString();
      if (today !== this.lastClearDate) {
        this.dailyVisitors.clear();
        this.lastClearDate = today;
      }

      // 2. Memory Cache Check (Synchronous check prevents race conditions)
      if (this.dailyVisitors.has(ip)) {
        return;
      }
      this.dailyVisitors.add(ip);

      // 3. Filter out ignored paths
      const IGNORED_PATHS = [
        '/public',
        '/api-docs',
        '/favicon.ico',
        '/api/health',
      ];
      if (IGNORED_PATHS.some((ignored) => path.startsWith(ignored))) {
        return;
      }

      // 4. Double Check DB (in case of server restart mid-day)
      const [rows] = await this.conn.query(
        'SELECT id FROM tn_visitor_log WHERE user_identifier = ? AND DATE(created_at) = CURDATE() LIMIT 1',
        [ip],
      );

      if ((rows as any[]).length > 0) {
        return;
      }

      // 5. Insert log
      const safeIp = ip.substring(0, 255);
      const safeUa = userAgent.substring(0, 512);
      const safePath = path.substring(0, 255);

      await this.conn.query(
        'INSERT INTO tn_visitor_log (user_identifier, user_agent, path) VALUES (?, ?, ?)',
        [safeIp, safeUa, safePath],
      );
    } catch (e) {
      // Silent failure
      // If insert fails (e.g. unique constraint if added later), we just ignore
    }
  }
}
