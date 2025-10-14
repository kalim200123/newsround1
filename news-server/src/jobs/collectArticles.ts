import pool from '../config/db';
import { FEEDS } from '../config/feeds';
import Parser from 'rss-parser';

// 스크립트의 메인 로직을 담을 비동기 함수
const collectLatestArticles = async () => {
  console.log('최신 기사 수집을 시작합니다...');
  let connection;
  try {
    // 1. 데이터베이스 커넥션을 가져옵니다.
    connection = await pool.getConnection();
    console.log('데이터베이스에 연결되었습니다.');

    // 2. 여기에 RSS 피드를 읽고, 파싱하는 코드가 들어갑니다.

    // 3. 여기에 새로운 기사만 필터링해서 DB에 저장하는 코드가 들어갑니다.

    console.log('최신 기사 수집을 성공적으로 완료했습니다.');

  } catch (error) {
    console.error('기사 수집 중 오류가 발생했습니다:', error);
  } finally {
    // 4. 작업이 끝나면 반드시 커넥션을 반환합니다.
    if (connection) {
      connection.release();
      console.log('데이터베이스 연결이 종료되었습니다.');
    }
  }
};

// 스크립트 실행
collectLatestArticles();
