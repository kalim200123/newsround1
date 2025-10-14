import pool from '../config/db';
import { FEEDS } from '../config/feeds';
import Parser from 'rss-parser';
import { RowDataPacket } from 'mysql2';

// 작업이 실행 중인지 확인하기 위한 잠금 변수
let isJobRunning = false;

/**
 * 모든 RSS 피드를 순회하며, `tn_home_article` 테이블에 없는 새로운 기사만 수집하여 저장합니다.
 */
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

    const parser = new Parser({
      headers: customHeaders,
    });

    const feedPromises = FEEDS.map(async (feed) => {
      try {
        const encodedUrl = encodeURI(feed.url);
        const parsedFeed = await parser.parseURL(encodedUrl);
        if (parsedFeed && parsedFeed.items) {
            parsedFeed.items.forEach(item => {
                if (item.link && item.title) {
                    allParsedArticles.push({
                        source: feed.source,
                        source_domain: feed.source_domain,
                        side: feed.side,
                        title: item.title,
                        url: item.link,
                        published_at: item.pubDate ? new Date(item.pubDate) : null,
                        thumbnail_url: item.enclosure?.url || null, // 기본 썸네일 로직
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

    if (allParsedArticles.length === 0) {
      console.log('파싱된 기사가 없어 작업을 종료합니다.');
      return { success: true, message: 'No new articles parsed.', articlesAdded: 0 };
    }

    const allUrls = allParsedArticles.map(article => article.url);
    const [existingRows] = await connection.query<RowDataPacket[]>(
      'SELECT url FROM tn_home_article WHERE url IN (?)',
      [allUrls]
    );
    const existingUrls = new Set(existingRows.map(row => row.url));

    const newArticles = allParsedArticles.filter(article => !existingUrls.has(article.url));
    console.log(`총 ${newArticles.length}개의 새로운 기사를 발견했습니다.`);

    if (newArticles.length > 0) {
      const values = newArticles.map(article => [
        article.source,
        article.source_domain,
        article.title,
        article.url,
        article.published_at,
        article.thumbnail_url
      ]);

      await connection.query(
        'INSERT INTO tn_home_article (source, source_domain, title, url, published_at, thumbnail_url) VALUES ?',
        [values]
      );
      console.log(`${newArticles.length}개의 새로운 기사를 데이터베이스에 저장했습니다.`);
    }

    console.log('최신 기사 수집을 성공적으로 완료했습니다.');
    return { success: true, message: 'Collection finished successfully.', articlesAdded: newArticles.length };

  } catch (error) {
    console.error('기사 수집 중 오류가 발생했습니다:', error);
    return { success: false, message: (error as Error).message };
  } finally {
    if (connection) {
      connection.release();
      console.log('데이터베이스 연결이 종료되었습니다.');
    }
    isJobRunning = false; // 작업이 끝나면 잠금 해제
  }
};

// 이 파일이 직접 실행되었을 때만 아래 코드를 실행합니다. (로컬 테스트용)
// require.main === module 은 Node.js 환경에서 현재 모듈이 엔트리 포인트인지 확인하는 표준적인 방법입니다.
if (require.main === module) {
  collectLatestArticles()
    .then(result => console.log('Standalone execution result:', result))
    .catch(error => console.error('Standalone execution failed:', error));
}