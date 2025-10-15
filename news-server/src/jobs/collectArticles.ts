import pool from '../config/db';
import { FEEDS } from '../config/feeds';
import Parser from 'rss-parser';
import { RowDataPacket } from 'mysql2';
import * as cheerio from 'cheerio';
import axios from 'axios';

// ... (타입 정의, 상수 등은 이전과 동일) ...

export const collectLatestArticles = async () => {
  console.log('최종 디버깅 모드로 기사 수집을 시작합니다...');
  try {
    // 1. 딱 하나의 피드만 선택
    const targetFeed = FEEDS.find(f => f.source === '경향신문');
    if (!targetFeed) {
      console.log('경향신문 피드를 찾을 수 없습니다.');
      return;
    }
    console.log(`타겟 피드: ${targetFeed.url}`);

    // 2. Axios로 직접 XML 가져오기
    const response = await axios.get<string>(encodeURI(targetFeed.url), {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        }
    });

    // 3. 가져온 XML 원본 텍스트를 로그로 출력
    console.log('--- RAW XML DATA ---');
    console.log(response.data);
    console.log('--- END RAW XML DATA ---');

    // 4. 파싱 시도
    const parser = new Parser();
    const parsedFeed = await parser.parseString(response.data);
    
    console.log(`파싱된 아이템 개수: ${parsedFeed.items.length}`);
    if (parsedFeed.items.length > 0) {
        console.log('첫 번째 아이템 제목:', parsedFeed.items[0].title);
    }

  } catch (error) {
    console.error('최종 디버깅 중 오류 발생:', error);
  }
};

if (require.main === module) {
  collectLatestArticles();
}
