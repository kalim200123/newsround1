import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { DB_CONNECTION_POOL } from '../database/database.constants';

// TODO: Move to a shared constant file
const FAVICON_URLS: Record<string, string> = {
  'yna.co.kr': 'https://www.google.com/s2/favicons?domain=yna.co.kr&sz=32',
  'hani.co.kr': 'https://www.google.com/s2/favicons?domain=hani.co.kr&sz=32',
  'khan.co.kr': 'https://www.google.com/s2/favicons?domain=khan.co.kr&sz=32',
  'ohmynews.com':
    'https://www.google.com/s2/favicons?domain=ohmynews.com&sz=32',
  'chosun.com': 'https://www.google.com/s2/favicons?domain=chosun.com&sz=32',
  'joongang.co.kr':
    'https://www.google.com/s2/favicons?domain=joongang.co.kr&sz=32',
  'donga.com': 'https://www.google.com/s2/favicons?domain=donga.com&sz=32',
  'newsis.com': 'https://www.google.com/s2/favicons?domain=newsis.com&sz=32',
};

@Injectable()
export class KeywordsService {
  constructor(@Inject(DB_CONNECTION_POOL) private conn: Pool) {}

  async getTrendingKeywords() {
    // 1. DB에서 키워드 조회 (최대 5개)
    const [keywords]: any = await this.conn.query(`
      SELECT keyword
      FROM tn_trending_keyword
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (keywords.length === 0) {
      return [];
    }

    // 2. 각 키워드별 기사 수 및 대표 기사 3개 조회
    const results = await Promise.all(
      keywords.map(async (kw: any) => {
        const keyword = kw.keyword;

        // 기사 수 및 언론사 수 조회
        const [counts]: any = await this.conn.query(
          `
          SELECT 
            COUNT(*) as article_count,
            COUNT(DISTINCT source) as source_count
          FROM tn_home_article
          WHERE 
            title LIKE ?
        `,
          [`%${keyword}%`],
        );

        // 최신 기사 3개 조회
        const [articles]: any = await this.conn.query(
          `
          SELECT *
          FROM tn_home_article
          WHERE 
            title LIKE ?
          ORDER BY published_at DESC
          LIMIT 3
        `,
          [`%${keyword}%`],
        );

        const articlesWithFavicon = (articles as any[]).map((article) => ({
          ...article,
          favicon_url: FAVICON_URLS[article.source_domain] || null,
        }));

        return {
          keyword,
          article_count: counts[0].article_count,
          source_count: counts[0].source_count,
          articles: articlesWithFavicon,
        };
      }),
    );

    return results;
  }
}
