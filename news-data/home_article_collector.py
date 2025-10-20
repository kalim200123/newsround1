import os
import re
import sys
import time
import html
from datetime import datetime, timezone, timedelta
import feedparser
import mysql.connector
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from dotenv import load_dotenv
import concurrent.futures

# .env 파일에서 환경 변수 로드
load_dotenv()

# --- 상수 및 설정 ---
JOONGANG_LOGO_URL = 'https://img.megazonesoft.com/wp-content/uploads/2024/03/28110237/%EC%A4%91%EC%95%99%EC%9D%BC%EB%B3%B4-%EA%B0%80%EB%A1%9C-%EB%A1%9C%EA%B3%A0.jpg'
LOGO_FALLBACK_MAP = {
    '경향신문': 'https://img.khan.co.kr/spko/aboutkh/img_ci_head_news.png',
    '한겨레': 'https://img.hani.co.kr/imgdb/original/2023/0227/3716774589571649.jpg',
    '오마이뉴스': 'https://ojsimg.ohmynews.com/sns/ohmynews_og.png',
    '조선일보': 'https://www.syu.ac.kr/wp-content/uploads/2021/06/%EC%A1%B0%EC%84%A0%EC%9D%BC%EB%B3%B4-ci-640x397.jpg',
    '동아일보': 'https://image.donga.com/DAMG/ci/dongailbo.jpg',
    '중앙일보': JOONGANG_LOGO_URL,
}

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_DATABASE"),
}

# 환경에 따라 SSL 설정을 동적으로 추가
if os.getenv("DB_SSL_ENABLED") == 'true':
    is_production = os.getenv('NODE_ENV') == 'production'
    if is_production:
        # Render와 같은 프로덕션 환경
        DB_CONFIG["ssl_ca"] = "/etc/ssl/certs/ca-certificates.crt"
        DB_CONFIG["ssl_verify_cert"] = True
    else:
        # 로컬 개발 환경 (인증서 검증 안 함)
        DB_CONFIG["ssl_verify_cert"] = False

FEEDS = [
    # LEFT
    {'source': "경향신문", 'source_domain': "khan.co.kr", 'side': "LEFT", 'url': "https://www.khan.co.kr/rss/rssdata/politic_news.xml", 'section': "정치"},
    {'source': "경향신문", 'source_domain': "khan.co.kr", 'side': "LEFT", 'url': "https://www.khan.co.kr/rss/rssdata/economy_news.xml", 'section': "경제"},
    {'source': "경향신문", 'source_domain': "khan.co.kr", 'side': "LEFT", 'url': "https://www.khan.co.kr/rss/rssdata/society_news.xml", 'section': "사회"},
    {'source': "경향신문", 'source_domain': "khan.co.kr", 'side': "LEFT", 'url': "https://www.khan.co.kr/rss/rssdata/culture_news.xml", 'section': "문화"},
    {'source': "한겨레",   'source_domain': "hani.co.kr", 'side': "LEFT", 'url': "https://www.hani.co.kr/rss/politics/", 'section': "정치"},
    {'source': "한겨레",   'source_domain': "hani.co.kr", 'side': "LEFT", 'url': "https://www.hani.co.kr/rss/economy/", 'section': "경제"},
    {'source': "한겨레",   'source_domain': "hani.co.kr", 'side': "LEFT", 'url': "https://www.hani.co.kr/rss/society/", 'section': "사회"},
    {'source': "한겨레",   'source_domain': "hani.co.kr", 'side': "LEFT", 'url': "https://www.hani.co.kr/rss/culture/", 'section': "문화"},
    {'source': "오마이뉴스", 'source_domain': "ohmynews.com", 'side': "LEFT", 'url': "http://rss.ohmynews.com/rss/politics.xml", 'section': "정치"},
    {'source': "오마이뉴스", 'source_domain': "ohmynews.com", 'side': "LEFT", 'url': "http://rss.ohmynews.com/rss/economy.xml", 'section': "경제"},
    {'source': "오마이뉴스", 'source_domain': "ohmynews.com", 'side': "LEFT", 'url': "http://rss.ohmynews.com/rss/society.xml", 'section': "사회"},
    {'source': "오마이뉴스", 'source_domain': "ohmynews.com", 'side': "LEFT", 'url': "http://rss.ohmynews.com/rss/culture.xml", 'section': "문화"},
    # RIGHT
    {'source': "조선일보", 'source_domain': "chosun.com", 'side': "RIGHT", 'url': "https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml", 'section': "정치"},
    {'source': "조선일보", 'source_domain': "chosun.com", 'side': "RIGHT", 'url': "https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml", 'section': "경제"},
    {'source': "조선일보", 'source_domain': "chosun.com", 'side': "RIGHT", 'url': "https://www.chosun.com/arc/outboundfeeds/rss/category/society/?outputType=xml", 'section': "사회"},
    {'source': "조선일보", 'source_domain': "chosun.com", 'side': "RIGHT", 'url': "https://www.chosun.com/arc/outboundfeeds/rss/category/culture/?outputType=xml", 'section': "문화"},
    {'source': "중앙일보", 'source_domain': "joongang.co.kr", 'side': "RIGHT", 'url': "https://news.google.com/rss/search?q=site:joongang.co.kr%20정치&hl=ko&gl=KR&ceid=KR%3Ako", 'section': "정치"},
    {'source': "중앙일보", 'source_domain': "joongang.co.kr", 'side': "RIGHT", 'url': "https://news.google.com/rss/search?q=site:joongang.co.kr%20경제&hl=ko&gl=KR&ceid=KR%3Ako", 'section': "경제"},
    {'source': "중앙일보", 'source_domain': "joongang.co.kr", 'side': "RIGHT", 'url': "https://news.google.com/rss/search?q=site:joongang.co.kr%20사회&hl=ko&gl=KR&ceid=KR%3Ako", 'section': "사회"},
    {'source': "중앙일보", 'source_domain': "joongang.co.kr", 'side': "RIGHT", 'url': "https://news.google.com/rss/search?q=site:joongang.co.kr%20문화&hl=ko&gl=KR&ceid=KR%3Ako", 'section': "문화"},
    {'source': "동아일보", 'source_domain': "donga.com", 'side': "RIGHT", 'url': "https://rss.donga.com/politics.xml", 'section': "정치"},
    {'source': "동아일보", 'source_domain': "donga.com", 'side': "RIGHT", 'url': "https://rss.donga.com/economy.xml", 'section': "경제"},
    {'source': "동아일보", 'source_domain': "donga.com", 'side': "RIGHT", 'url': "https://rss.donga.com/national.xml", 'section': "사회"},
    {'source': "동아일보", 'source_domain': "donga.com", 'side': "RIGHT", 'url': "https://rss.donga.com/culture.xml", 'section': "문화"},
]

# --- 헬퍼 함수 ---
def resolve_google_news_url(url):
    if 'news.google.com' in url:
        try:
            response = requests.head(url, allow_redirects=True, timeout=5)
            return response.url
        except requests.RequestException:
            return url
    return url

def scrape_og_image(url):
    try:
        response = requests.get(url, timeout=5)
        soup = BeautifulSoup(response.content, 'html.parser')
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content', '').startswith('http'):
            return og_image['content']
    except requests.RequestException:
        pass
    return None

def clean_title(title):
    if not title: return ''
    publisher_regex = re.compile(r'\s*[-–—|:]\s*(중앙일보|조선일보|동아일보|한겨레|경향신문|오마이뉴스|joongang|chosun|donga|hani|khan)\s*$', re.I)
    return publisher_regex.sub('', title).strip()


def fetch_and_parse_feed(feed_info):
    """단일 RSS 피드를 가져와 파싱하고 기사 목록을 반환합니다."""
    articles = []
    try:
        response = requests.get(feed_info['url'], timeout=15)
        response.encoding = 'utf-8'
        parsed_feed = feedparser.parse(response.text)

        for item in parsed_feed.entries:
            if not item.get('link') or not item.get('title'):
                continue

            final_url = resolve_google_news_url(item.link)
            cleaned_title = clean_title(item.title)
            final_title = html.unescape(cleaned_title)

            published_time = None
            if hasattr(item, 'published_parsed') and item.published_parsed:
                published_time = datetime.fromtimestamp(time.mktime(item.published_parsed))
            else:
                published_time = datetime.now(timezone.utc)

            thumbnail_url = None
            source_name = feed_info['source']

            if source_name != '중앙일보':
                if hasattr(item, 'description'):
                    soup = BeautifulSoup(item.description, 'html.parser')
                    img_tag = soup.find('img')
                    if img_tag and img_tag.get('src', '').startswith('http'):
                        thumbnail_url = img_tag['src']
                if not thumbnail_url:
                    thumbnail_url = scrape_og_image(final_url)
            
            if not thumbnail_url:
                thumbnail_url = LOGO_FALLBACK_MAP.get(source_name)

            articles.append({
                'source': feed_info['source'],
                'source_domain': feed_info['source_domain'],
                'category': feed_info['section'],
                'title': final_title,
                'url': final_url,
                'published_at': published_time,
                'thumbnail_url': thumbnail_url
            })
    except Exception as e:
        print(f"{feed_info['source']}' 피드 처리 실패: {e}")
    return articles

# --- 메인 로직 ---
def main():
    print("최신 기사 병렬 수집 시작 (Python)")
    all_articles = []

    # ThreadPoolExecutor를 사용하여 피드를 병렬로 처리
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_feed = {executor.submit(fetch_and_parse_feed, feed): feed for feed in FEEDS}
        for future in concurrent.futures.as_completed(future_to_feed):
            try:
                articles_from_feed = future.result()
                if articles_from_feed:
                    all_articles.extend(articles_from_feed)
            except Exception as exc:
                feed_info = future_to_feed[future]
                print(f"{feed_info['source']} 피드 처리 중 예외 발생: {exc}")

    print(f"총 {len(all_articles)}개 기사 파싱 완료.")

    # DB에 저장
    if not all_articles:
        return

    try:
        cnx = mysql.connector.connect(**DB_CONFIG)
        cursor = cnx.cursor()

        print(f"{len(all_articles)}개의 기사를 DB에 저장 시도합니다.")

        if all_articles:
            # INSERT IGNORE를 사용하여 DB가 중복을 처리하도록 합니다.
            insert_query = "INSERT IGNORE INTO tn_home_article (source, source_domain, category, title, url, published_at, thumbnail_url) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            data_to_insert = [(a['source'], a['source_domain'], a['category'], a['title'], a['url'], a['published_at'], a['thumbnail_url']) for a in all_articles]
            cursor.executemany(insert_query, data_to_insert)
            cnx.commit()
            print(f"{cursor.rowcount}개 기사 신규 저장 완료.")

    except mysql.connector.Error as err:
        print(f"DB 오류 발생: {err}")
        sys.exit(1)
    finally:
        if 'cnx' in locals() and cnx.is_connected():
            cursor.close()
            cnx.close()

if __name__ == "__main__":
    main()
