import pool from '../config/db';
import { FEEDS } from '../config/feeds';
import Parser from 'rss-parser';
import { RowDataPacket } from 'mysql2';
import * as cheerio from 'cheerio';

let isJobRunning = false;

const JOONGANG_LOGO_URL = 'https://img.megazonesoft.com/wp-content/uploads/2024/03/28110237/%EC%A4%91%EC%95%99%EC%9D%BC%EB%B3%B4-%EA%B0%80%EB%A1%9C-%EB%A1%9C%EA%B3%A0.jpg'; // 중앙일보 로고 URL

export const collectLatestArticles = async () => {
  if (isJobRunning) {
    console.log('이전 기사 수집 작업이 아직 실행 중입니다. 이번 실행은 건너뜁니다.');
    return { success: false, message: 'Job already running' };
  }

  isJobRunning = true;
  console.log('최신 기사 수집을 시작합니다...');
  let connection;

  try {
    connection = await pool.getConnection();
    console.log('데이터베이스에 연결되었습니다.');

    const customHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    };

    const parser = new Parser({
      headers: customHeaders,
    });

    const allParsedArticles: any[] = [];

    const feedPromises = FEEDS.map(async (feed) => {
      try {
        const encodedUrl = encodeURI(feed.url);
        const parsedFeed = await parser.parseURL(encodedUrl);
        if (parsedFeed && parsedFeed.items) {
          parsedFeed.items.forEach(item => {
            if (item.link && item.title) {
              const dateString = item.isoDate || item.pubDate;
              const publishedDate = dateString ? new Date(dateString) : new Date();

              // [수정] 썸네일 추출 로직
              let thumbnailUrl = null;
              if (item.description) {
                const $ = cheerio.load(item.description);
                thumbnailUrl = $('img').attr('src') || null;
              }
              // 중앙일보 fallback 로직
              if (!thumbnailUrl && feed.source === '중앙일보') {
                thumbnailUrl = JOONGANG_LOGO_URL;
              }

              allParsedArticles.push({
                source: feed.source,
                source_domain: feed.source_domain,
                category: feed.section,
                title: item.title,
                url: item.link,
                published_at: publishedDate,
                thumbnail_url: thumbnailUrl, // 최종 썸네일 URL
              });
            }
          });
        }
      } catch (error) {
        console.error(`'${feed.source}' (${feed.url}) 피드 파싱 중 오류 발생:`, error);
      }
    });

    await Promise.allSettled(feedPromises);
    console.log(`총 ${allParsedArticles.length}개의 기사를 피드에서 파싱했습니다.`);

    const uniqueArticlesMap = new Map<string, any>();
    allParsedArticles.forEach(article => {
      if (!uniqueArticlesMap.has(article.url)) {
        uniqueArticlesMap.set(article.url, article);
      }
    });
    const uniqueParsedArticles = Array.from(uniqueArticlesMap.values());
    console.log(`중복 제거 후 ${uniqueParsedArticles.length}개의 고유한 기사를 확인했습니다.`);

    if (uniqueParsedArticles.length === 0) {
      console.log('파싱된 기사가 없어 작업을 종료합니다.');
      isJobRunning = false;
      return { success: true, message: 'No new articles parsed.', articlesAdded: 0 };
    }

    const allUrls = uniqueParsedArticles.map(article => article.url);
    const [existingRows] = await connection.query<RowDataPacket[]>(
      'SELECT url FROM tn_home_article WHERE url IN (?)',
      [allUrls]
    );
    const existingUrls = new Set(existingRows.map(row => row.url));

    const newArticles = uniqueParsedArticles.filter(article => !existingUrls.has(article.url));
    console.log(`총 ${newArticles.length}개의 새로운 기사를 발견했습니다.`);

    if (newArticles.length > 0) {
      const values = newArticles.map(article => [
        article.source,
        article.source_domain,
        article.category,
        article.title,
        article.url,
        article.published_at,
        article.thumbnail_url, // 썸네일 추가
      ]);

      await connection.query(
        'INSERT INTO tn_home_article (source, source_domain, category, title, url, published_at, thumbnail_url) VALUES ?',
        [values]
      );
      console.log(`${newArticles.length}개의 새로운 기사를 데이터베이스에 저장했습니다.`);
    }

    console.log('최신 기사 수집을 성공적으로 완료했습니다.');
    isJobRunning = false;
    return { success: true, message: 'Collection finished successfully.', articlesAdded: newArticles.length };

  } catch (error) {
    console.error('기사 수집 중 오류가 발생했습니다:', error);
    isJobRunning = false;
    return { success: false, message: (error as Error).message };
  } finally {
    if (connection) {
      connection.release();
      console.log('데이터베이스 연결이 종료되었습니다.');
    }
    isJobRunning = false;
  }
};

if (require.main === module) {
  collectLatestArticles()
    .then(result => console.log('Standalone execution result:', result))
    .catch(error => console.error('Standalone execution failed:', error));
}
