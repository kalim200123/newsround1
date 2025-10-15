import pool from '../config/db';
import { FEEDS } from '../config/feeds';
import Parser from 'rss-parser';
import { RowDataPacket } from 'mysql2';
import * as cheerio from 'cheerio';
import axios from 'axios';

// --- 타입 정의 ---
interface CustomFeedItem extends Parser.Item {
  'content:encoded': string;
}

interface ParsedArticle {
  source: string;
  source_domain: string;
  category: string;
  title: string;
  url: string;
  published_at: Date;
  thumbnail_url: string | null;
}

// --- 상수 및 상태 변수 ---
let isJobRunning = false;
const JOONGANG_LOGO_URL = 'https://img.megazonesoft.com/wp-content/uploads/2024/03/28110237/%EC%A4%91%EC%95%99%EC%9D%BC%EB%B3%B4-%EA%B0%80%EB%A1%9C-%EB%A1%9C%EA%B3%A0.jpg';
const LOGO_FALLBACK_MAP: { [key: string]: string } = {
  '경향신문': 'https://img.khan.co.kr/spko/aboutkh/img_ci_head_news.png',
  '한겨레': 'https://img.hani.co.kr/imgdb/original/2023/0227/3716774589571649.jpg',
  '오마이뉴스': 'https://ojsimg.ohmynews.com/sns/ohmynews_og.png',
  '조선일보': 'https://www.syu.ac.kr/wp-content/uploads/2021/06/%EC%A1%B0%EC%84%A0%EC%9D%BC%EB%B3%B4-ci-640x397.jpg',
  '동아일보': 'https://image.donga.com/DAMG/ci/dongailbo.jpg',
  '중앙일보': JOONGANG_LOGO_URL,
};

// --- 헬퍼 함수 ---
async function resolveGoogleNewsUrl(url: string): Promise<string> {
  if (url.includes('news.google.com')) {
    try {
      const response = await axios.get(url, { maxRedirects: 5, timeout: 5000 } as any);
      return (response as any).request.res.responseUrl || url;
    } catch (error) {
      console.error(`Google News URL 확인 중 오류: ${url}`, error);
      return url;
    }
  }
  return url;
}

async function scrapeOgImage(url: string): Promise<string | null> {
  try {
    const { data: html } = await axios.get<string>(url, { timeout: 5000 });
    const $ = cheerio.load(html);
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && ogImage.startsWith('http')) {
      return ogImage;
    }
    return null;
  } catch (error) {
    return null;
  }
}

function cleanTitle(title: string): string {
    if (!title) return '';
    const publisherRegex = new RegExp(`\s*[-–—|:]\s*(중앙일보|조선일보|동아일보|한겨레|경향신문|오마이뉴스|joongang|chosun|donga|hani|khan)\s*$`, 'i');
    return title.replace(publisherRegex, '').trim();
}

// --- 메인 로직 ---
export const collectLatestArticles = async () => {
  if (isJobRunning) {
    console.log('이전 작업 실행 중...');
    return { success: false, message: 'Job already running' };
  }
  isJobRunning = true;
  console.log('최신 기사 수집 시작...');
  let connection;
  try {
    connection = await pool.getConnection();
    const parser = new Parser<any, CustomFeedItem>({ customFields: { item: ['content:encoded'] } });
    let initialParsedArticles: any[] = [];

    const feedPromises = FEEDS.map(async (feed) => {
      try {
        const response = await axios.get<string>(encodeURI(feed.url), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            }
        });
        const parsedFeed = await parser.parseString(response.data);

        if (parsedFeed && parsedFeed.items) {
          parsedFeed.items.forEach((item: CustomFeedItem) => {
            if (item.link && item.title) {
              initialParsedArticles.push({ feed, item });
            }
          });
        }
      } catch (error) {
        console.error(`'${feed.source}' 피드 처리 실패:`, error);
      }
    });

    await Promise.all(feedPromises);
    console.log(`총 ${initialParsedArticles.length}개 기사 아이템 파싱 완료.`);

    const processingPromises = initialParsedArticles.map(async ({ feed, item }) => {
      const dateString = item.isoDate || item.pubDate;
      const publishedDate = dateString ? new Date(dateString) : new Date();
      const finalUrl = await resolveGoogleNewsUrl(item.link!);
      const cleanedTitle = cleanTitle(item.title!);

      const content = item['content:encoded'] || item.content || '';
      let thumbnailUrl: string | null = null;
      if (content) {
        const $ = cheerio.load(content);
        const imgTag = $('img').first();
        if (imgTag.length) {
          const potentialUrl = imgTag.attr('data-src') || imgTag.attr('src') || null;
          if (potentialUrl && potentialUrl.startsWith('http')) {
            thumbnailUrl = potentialUrl;
          }
        }
      }

      if (!thumbnailUrl) {
        thumbnailUrl = await scrapeOgImage(finalUrl);
      }

      if (!thumbnailUrl) {
        thumbnailUrl = LOGO_FALLBACK_MAP[feed.source] || null;
      }

      return {
        source: feed.source, source_domain: feed.source_domain, category: feed.section,
        title: cleanedTitle, url: finalUrl, published_at: publishedDate, thumbnail_url: thumbnailUrl,
      };
    });

    const allParsedArticles = await Promise.all(processingPromises);
    console.log(`총 ${allParsedArticles.length}개 기사 처리 완료.`);

    const uniqueArticlesMap = new Map<string, ParsedArticle>();
    allParsedArticles.forEach(article => { if (!uniqueArticlesMap.has(article.url)) { uniqueArticlesMap.set(article.url, article); } });
    const uniqueParsedArticles = Array.from(uniqueArticlesMap.values());

    let newArticles: ParsedArticle[] = [];

    if (uniqueParsedArticles.length > 0) {
      const allUrls = uniqueParsedArticles.map(article => article.url);
      const [existingRows] = await connection.query<RowDataPacket[]>('SELECT url FROM tn_home_article WHERE url IN (?)', [allUrls]);
      const existingUrls = new Set(existingRows.map(row => row.url));
      newArticles = uniqueParsedArticles.filter(article => !existingUrls.has(article.url));
      console.log(`${newArticles.length}개의 새로운 기사 발견.`);

      if (newArticles.length > 0) {
        const values = newArticles.map(a => [a.source, a.source_domain, a.category, a.title, a.url, a.published_at, a.thumbnail_url]);
        await connection.query('INSERT INTO tn_home_article (source, source_domain, category, title, url, published_at, thumbnail_url) VALUES ?', [values]);
        console.log(`${newArticles.length}개 기사 저장 완료.`);
      }
    } else {
        console.log('파싱된 기사가 없어 DB 확인을 건너뜁니다.');
    }

    console.log('기사 수집 작업 완료.');
    return { success: true, articlesAdded: newArticles.length };

  } catch (error) {
    console.error('기사 수집 중 오류:', error);
    return { success: false, message: (error as Error).message };
  } finally {
    if (connection) connection.release();
    isJobRunning = false;
  }
};

if (require.main === module) {
  collectLatestArticles().then(r => console.log('실행 결과:', r));
}