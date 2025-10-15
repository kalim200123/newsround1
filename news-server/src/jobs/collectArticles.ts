import pool from '../config/db';
import { FEEDS } from '../config/feeds';
import Parser from 'rss-parser';
import { RowDataPacket } from 'mysql2';
import * as cheerio from 'cheerio';
import axios from 'axios';

let isJobRunning = false;

// [추가] 언론사별 로고 대체 URL 맵
const LOGO_FALLBACK_MAP: { [key: string]: string } = {
  '경향신문': 'https://img.khan.co.kr/spko/aboutkh/img_ci_head_news.png',
  '한겨레': 'https://img.hani.co.kr/imgdb/original/2023/0227/3716774589571649.jpg',
  '오마이뉴스': 'https://ojsimg.ohmynews.com/sns/ohmynews_og.png',
  '조선일보': 'https://www.syu.ac.kr/wp-content/uploads/2021/06/%EC%A1%B0%EC%84%A0%EC%9D%BC%EB%B3%B4-ci-640x397.jpg',
  '동아일보': 'https://image.donga.com/DAMG/ci/dongailbo.jpg',
  '중앙일보': 'https://img.megazonesoft.com/wp-content/uploads/2024/03/28110237/%EC%A4%91%EC%95%99%EC%9D%BC%EB%B3%B4-%EA%B0%80%EB%A1%9C-%EB%A1%9C%EA%B3%A0.jpg',
};

// [추가] OG Image 스크레이핑 함수
async function scrapeOgImage(url: string): Promise<string | null> {
  try {
    const { data: html } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(html);
    const ogImage = $('meta[property="og:image"]').attr('content');
    return ogImage || null;
  } catch (error) {
    // console.error(`OG Image 스크레이핑 실패: ${url}`, error);
    return null;
  }
}

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
    const parser = new Parser<any, any>({ customFields: { item: ['content:encoded'] } });
    let allParsedArticles: any[] = [];

    // 1. 모든 RSS 피드에서 기본 정보 파싱
    const feedPromises = FEEDS.map(async (feed) => {
      try {
        const parsedFeed = await parser.parseURL(encodeURI(feed.url));
        return { feed, items: parsedFeed.items || [] };
      } catch (error) {
        console.error(`'${feed.source}' 피드 파싱 실패:`, error);
        return { feed, items: [] };
      }
    });
    const results = await Promise.allSettled(feedPromises);

    // 2. 썸네일 및 최종 데이터 정리 (하이브리드 방식)
    const processingPromises = results.map(async (result) => {
      if (result.status === 'fulfilled' && result.value) {
        const { feed, items } = result.value;
        for (const item of items) {
          if (!item.link || !item.title) continue;

          const dateString = item.isoDate || item.pubDate;
          const publishedDate = dateString ? new Date(dateString) : new Date();
          const finalUrl = await resolveGoogleNewsUrl(item.link);

          // 1차: RSS 내부에서 썸네일 시도
          const content = item['content:encoded'] || item.content || '';
          let thumbnailUrl = null;
          if (content) {
            const $ = cheerio.load(content);
            const imgTag = $('img').first();
            if (imgTag.length) {
              thumbnailUrl = imgTag.attr('data-src') || imgTag.attr('src') || null;
            }
          }

          // 2차: 1차 실패 시, OG Image 스크레이핑 시도
          if (!thumbnailUrl) {
            thumbnailUrl = await scrapeOgImage(finalUrl);
          }

          // 3차: 2차도 실패 시, 로고 URL로 대체
          if (!thumbnailUrl) {
            thumbnailUrl = LOGO_FALLBACK_MAP[feed.source] || null;
          }

          allParsedArticles.push({
            source: feed.source, source_domain: feed.source_domain, category: feed.section,
            title: item.title, url: finalUrl, published_at: publishedDate, thumbnail_url: thumbnailUrl,
          });
        }
      }
    });
    await Promise.all(processingPromises);

    // 3. 중복 제거 및 DB 저장 (기존 로직과 동일)
    const uniqueArticlesMap = new Map<string, any>();
    allParsedArticles.forEach(article => { if (!uniqueArticlesMap.has(article.url)) { uniqueArticlesMap.set(article.url, article); } });
    const uniqueParsedArticles = Array.from(uniqueArticlesMap.values());
    console.log(`중복 제거 후 ${uniqueParsedArticles.length}개 기사 확인.`);

    if (uniqueParsedArticles.length > 0) {
      const allUrls = uniqueParsedArticles.map(article => article.url);
      const [existingRows] = await connection.query<RowDataPacket[]>('SELECT url FROM tn_home_article WHERE url IN (?)', [allUrls]);
      const existingUrls = new Set(existingRows.map(row => row.url));
      const newArticles = uniqueParsedArticles.filter(article => !existingUrls.has(article.url));
      console.log(`${newArticles.length}개의 새로운 기사 발견.`);

      if (newArticles.length > 0) {
        const values = newArticles.map(a => [a.source, a.source_domain, a.category, a.title, a.url, a.published_at, a.thumbnail_url]);
        await connection.query('INSERT INTO tn_home_article (source, source_domain, category, title, url, published_at, thumbnail_url) VALUES ?', [values]);
        console.log(`${newArticles.length}개 기사 저장 완료.`);
      }
    }

    console.log('기사 수집 완료.');
    return { success: true, articlesAdded: uniqueParsedArticles.length };
  } catch (error) {
    console.error('기사 수집 중 오류:', error);
    return { success: false, message: (error as Error).message };
  } finally {
    if (connection) connection.release();
    isJobRunning = false;
  }
};

// 로컬 테스트용 실행 코드
if (require.main === module) {
  collectLatestArticles().then(r => console.log('실행 결과:', r));
}
