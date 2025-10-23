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
from dateutil.parser import parse as dt_parse
import threading

# requests.Session의 고급 설정을 위한 import
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

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

KST = timezone(timedelta(hours=9))

# --- 헬퍼 함수 ---

def normalize_datetime_to_utc(dt: datetime) -> datetime:
    """시간대 정보가 없는 datetime은 KST로 간주하고, 모든 datetime을 UTC로 변환합니다."""
    if dt.tzinfo is None:
        # 시간대 정보가 없으면 KST로 설정
        dt = dt.replace(tzinfo=KST)
    # UTC로 변환
    return dt.astimezone(timezone.utc)

if os.getenv("DB_SSL_ENABLED") == 'true':
    is_production = os.getenv('NODE_ENV') == 'production'
    if is_production:
        DB_CONFIG["ssl_ca"] = "/etc/ssl/certs/ca-certificates.crt"
        DB_CONFIG["ssl_verify_cert"] = True
    else:
        DB_CONFIG["ssl_verify_cert"] = False

# 테스트를 위해 3개 언론사만 남김
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

# --- 고급 HTTP 세션 설정 (article_collector.py에서 복사) ---
retries = Retry(total=2, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504])
_session_local = threading.local()

def _create_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"})
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def get_http_session() -> requests.Session:
    session = getattr(_session_local, "session", None)
    if session is None:
        session = _create_session()
        _session_local.session = session
    return session

# --- 헬퍼 함수 ---
def resolve_google_news_url(url):
    if 'news.google.com' in url:
        try:
            session = get_http_session()
            response = session.head(url, allow_redirects=True, timeout=5)
            return response.url
        except requests.RequestException:
            return url
    return url

def scrape_og_image(url):
    try:
        session = get_http_session()
        response = session.get(url, timeout=5)
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

def scrape_hankyoreh_publication_time(url):
    try:
        session = get_http_session()
        response = session.get(url, timeout=5)
        soup = BeautifulSoup(response.content, 'html.parser')
        date_li = soup.find(lambda tag: tag.name == 'li' and '등록' in tag.get_text())
        if date_li:
            date_span = date_li.find('span')
            if date_span:
                return dt_parse(date_span.get_text())
    except Exception as e:
        print(f"[Scraper] Failed to scrape Hankyoreh date for {url}: {e}")
    return None

def fetch_and_parse_feed(feed_info):
    articles = []
    try:
        # 고급 세션을 사용하여 feedparser가 직접 URL을 처리하도록 함
        session = get_http_session()
        response = session.get(feed_info['url'], timeout=15)
        response.encoding = 'utf-8'
        parsed_feed = feedparser.parse(response.text)

        for item in parsed_feed.entries:
            if not item.get('link') or not item.get('title'):
                continue

            final_url = resolve_google_news_url(item.link)
            cleaned_title = clean_title(item.title)
            final_title = html.unescape(cleaned_title)
            
            description_html = item.get('description', item.get('summary', ''))
            description_text = re.sub('<[^<]+?>', '', description_html).strip()

            # --- 날짜 처리 시작 ---
            published_time_utc = None
            parsed_time = None
            source_name = feed_info['source']

            # 1. 한겨레는 직접 스크래핑
            if source_name == '한겨레':
                parsed_time = scrape_hankyoreh_publication_time(final_url)

            # 2. 파싱된 시간 정보 확인 (표준)
            if not parsed_time:
                time_struct = item.get('published_parsed') or item.get('updated_parsed')
                if time_struct:
                    parsed_time = datetime.fromtimestamp(time.mktime(time_struct))

            # 3. 원본 문자열에서 직접 파싱 시도
            if not parsed_time:
                date_string = item.get('published') or item.get('updated') or item.get('dc_date')
                if date_string:
                    try:
                        parsed_time = dt_parse(date_string)
                    except (ValueError, TypeError):
                        pass # 실패 시 None 유지
            
            # 4. 파싱된 시간이 있다면 UTC로 변환, 없으면 현재 시간(UTC)으로 대체
            if parsed_time:
                published_time_utc = normalize_datetime_to_utc(parsed_time)
            else:
                published_time_utc = datetime.now(timezone.utc)
            # --- 날짜 처리 끝 ---

            # 시간 필터링: 1일 이상 지난 기사는 건너뛰기 (UTC 기준)
            if published_time_utc < (datetime.now(timezone.utc) - timedelta(days=1)):
                continue

            thumbnail_url = None
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
                'published_at': published_time_utc, # 수정된 변수 사용
                'thumbnail_url': thumbnail_url,
                'description': description_text
            })
    except Exception as e:
        print(f"{feed_info['source']}' 피드 처리 실패: {e}")
    return articles

# --- 메인 로직 ---
def main():
    print("최신 기사 병렬 수집 시작 (Python)")
    all_articles = []

    print("Step 1: Starting parallel feed fetching...")
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

    print(f"Step 2: Completed parsing for a total of {len(all_articles)} articles.")

    if not all_articles:
        print("No new articles to save. Exiting.")
        return

    try:
        print("Step 3: Attempting to connect to the database...")
        cnx = mysql.connector.connect(**DB_CONFIG)
        cursor = cnx.cursor()
        print("Step 4: Database connection successful.")

        print(f"Step 5: Attempting to save {len(all_articles)} articles to the DB...")

        if all_articles:
            insert_query = "INSERT IGNORE INTO tn_home_article (source, source_domain, category, title, url, published_at, thumbnail_url, description) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
            data_to_insert = [(a['source'], a['source_domain'], a['category'], a['title'], a['url'], a['published_at'], a['thumbnail_url'], a['description']) for a in all_articles]
            cursor.executemany(insert_query, data_to_insert)
            cnx.commit()
            print(f"Step 6: {cursor.rowcount} new articles saved successfully.")

    except mysql.connector.Error as err:
        print(f"DB 오류 발생: {err}")
        sys.exit(1)
    finally:
        if 'cnx' in locals() and cnx.is_connected():
            cursor.close()
            cnx.close()

if __name__ == "__main__":
    main()
