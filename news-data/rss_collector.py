#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
home_article_collector.py
- Collects articles for the home page from various RSS feeds.
- Identifies breaking/exclusive news and triggers real-time notifications.
"""

import os
import re
import sys
import time
import html
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List, Any
import feedparser
import mysql.connector
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from dotenv import load_dotenv
import concurrent.futures
from dateutil.parser import parse as dt_parse
import threading
import calendar

# requests.Session의 고급 설정을 위한 import
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# .env 파일에서 환경 변수 로드
load_dotenv()

# --- 로깅 설정 ---
LOG_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
LOG_FILE_PATH = os.path.join(LOG_DIR, 'home_collector.log')
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# 로그 디렉토리 생성 (없는 경우)
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [rss_collector.py] [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE_PATH, mode='a', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

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

INTERNAL_API_URL = os.getenv("INTERNAL_NOTIFICATION_API_URL", "http://127.0.0.1:4001/api/internal/send-notification")

if os.getenv("DB_SSL_ENABLED") == 'true':
    is_production = os.getenv('NODE_ENV') == 'production'
    if is_production:
        DB_CONFIG["ssl_ca"] = "/etc/ssl/certs/ca-certificates.crt"
        DB_CONFIG["ssl_verify_cert"] = True
    else:
        DB_CONFIG["ssl_verify_cert"] = False

KST = timezone(timedelta(hours=9))

FEEDS: List[Dict[str, Any]] = [
    # LEFT
    {'source': "경향신문", 'source_domain': "khan.co.kr", 'side': "LEFT", 'url': "https://www.khan.co.kr/rss/rssdata/politic_news.xml", 'section': "정치"},
    {'source': "경향신문", 'source_domain': "khan.co.kr", 'side': "LEFT", 'url': "https://www.khan.co.kr/rss/rssdata/economy_news.xml", 'section': "경제"},
    {'source': "경향신문", 'source_domain': "khan.co.kr", 'side': "LEFT", 'url': "https://www.khan.co.kr/rss/rssdata/society_news.xml", 'section': "사회"},
    {'source': "경향신문", 'source_domain': "khan.co.kr", 'side': "LEFT", 'url': "https://www.khan.co.kr/rss/rssdata/kh_culture.xml", 'section': "문화"},
    {'source': "경향신문", 'source_domain': "khan.co.kr", 'side': "LEFT", 'url': "https://www.khan.co.kr/rss/rssdata/kh_sports.xml", 'section': "스포츠"},
   
   {'source': "한겨레",   'source_domain': "hani.co.kr", 'side': "LEFT", 'url': "https://www.hani.co.kr/rss/politics/", 'section': "정치"},
   {'source': "한겨레",   'source_domain': "hani.co.kr", 'side': "LEFT", 'url': "https://www.hani.co.kr/rss/economy/", 'section': "경제"},
   {'source': "한겨레",   'source_domain': "hani.co.kr", 'side': "LEFT", 'url': "https://www.hani.co.kr/rss/society/", 'section': "사회"},
   {'source': "한겨레", 'source_domain': "hani.co.kr", 'side': "LEFT", 'url': "https://www.hani.co.kr/rss/culture/", 'section': "문화"},
   {'source': "한겨레", 'source_domain': "hani.co.kr", 'side': "LEFT", 'url': "https://www.hani.co.kr/rss/sports/", 'section': "스포츠"},
   
    {'source': "오마이뉴스", 'source_domain': "ohmynews.com", 'side': "LEFT", 'url': "http://rss.ohmynews.com/rss/politics.xml", 'section': "정치"},
    {'source': "오마이뉴스", 'source_domain': "ohmynews.com", 'side': "LEFT", 'url': "http://rss.ohmynews.com/rss/economy.xml", 'section': "경제"},
    {'source': "오마이뉴스", 'source_domain': "ohmynews.com", 'side': "LEFT", 'url': "http://rss.ohmynews.com/rss/society.xml", 'section': "사회"},
    {'source': "오마이뉴스", 'source_domain': "ohmynews.com", 'side': "LEFT", 'url': "https://rss.ohmynews.com/rss/culture.xml", 'section': "문화"},
    {'source': "오마이뉴스", 'source_domain': "ohmynews.com", 'side': "LEFT", 'url': "https://rss.ohmynews.com/rss/sports.xml", 'section': "스포츠"},
   
    # Center
    {'source': "연합뉴스", 'source_domain': "yna.co.kr", 'side': "CENTER", 'url': "https://www.yna.co.kr/rss/politics.xml", 'section': "정치"},
    {'source': "연합뉴스", 'source_domain': "yna.co.kr", 'side': "CENTER", 'url': "https://www.yna.co.kr/rss/economy.xml", 'section': "경제"},
    {'source': "연합뉴스", 'source_domain': "yna.co.kr", 'side': "CENTER", 'url': "https://www.yna.co.kr/rss/society.xml", 'section': "사회"},
    {'source': "연합뉴스", 'source_domain': "yna.co.kr", 'side': "CENTER", 'url': "https://www.yna.co.kr/rss/culture.xml", 'section': "문화"},
    {'source': "연합뉴스", 'source_domain': "yna.co.kr", 'side': "CENTER", 'url': "https://www.yna.co.kr/rss/sports.xml", 'section': "스포츠"},
    {'source': "뉴시스", 'source_domain': "newsis.com", 'side': "CENTER", 'url': "https://www.newsis.com/RSS/politics.xml", 'section': "정치"},
    {'source': "뉴시스", 'source_domain': "newsis.com", 'side': "CENTER", 'url': "https://www.newsis.com/RSS/economy.xml", 'section': "경제"},
    {'source': "뉴시스", 'source_domain': "newsis.com", 'side': "CENTER", 'url': "https://www.newsis.com/RSS/society.xml", 'section': "사회"},
    {'source': "뉴시스", 'source_domain': "newsis.com", 'side': "CENTER", 'url': "https://www.newsis.com/RSS/culture.xml", 'section': "문화"},
    {'source': "뉴시스", 'source_domain': "newsis.com", 'side': "CENTER", 'url': "https://www.newsis.com/RSS/sports.xml", 'section': "스포츠"},
    
    # RIGHT
    {'source': "조선일보", 'source_domain': "chosun.com", 'side': "RIGHT", 'url': "https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml", 'section': "정치"},
    {'source': "조선일보", 'source_domain': "chosun.com", 'side': "RIGHT", 'url': "https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml", 'section': "경제"},
    {'source': "조선일보", 'source_domain': "chosun.com", 'side': "RIGHT", 'url': "https://www.chosun.com/arc/outboundfeeds/rss/category/national/?outputType=xml", 'section': "사회"},
    {'source': "조선일보", 'source_domain': "chosun.com", 'side': "RIGHT", 'url': "https://www.chosun.com/arc/outboundfeeds/rss/category/culture-life/?outputType=xml", 'section': "문화"},
    {'source': "조선일보", 'source_domain': "chosun.com", 'side': "RIGHT", 'url': "https://www.chosun.com/arc/outboundfeeds/rss/category/sports/?outputType=xml", 'section': "스포츠"},
  #  {'source': "중앙일보", 'source_domain': "joongang.co.kr", 'side': "RIGHT", 'url': "https://news.google.com/rss/search?q=site:joongang.co.kr%20정치&hl=ko&gl=KR&ceid=KR%3Ako", 'section': "정치"},
  #  {'source': "중앙일보", 'source_domain': "joongang.co.kr", 'side': "RIGHT", 'url': "https://news.google.com/rss/search?q=site:joongang.co.kr%20경제&hl=ko&gl=KR&ceid=KR%3Ako", 'section': "경제"},
  #  {'source': "중앙일보", 'source_domain': "joongang.co.kr", 'side': "RIGHT", 'url': "https://news.google.com/rss/search?q=site:joongang.co.kr%20사회&hl=ko&gl=KR&ceid=KR%3Ako", 'section': "사회"},
  #  {'source': "중앙일보", 'source_domain': "joongang.co.kr", 'side': "RIGHT", 'url': "https://news.google.com/rss/search?q=site:joongang.co.k#r%20%EB%AC%B8%ED%99%94&hl=ko&gl=KR&ceid=KR%3Ako", 'section': "문화"},
  #  {'source': "중앙일보", 'source_domain': "joongang.co.kr", 'side': "RIGHT", 'url': "https://news.google.com/rss/search?q=site:joongang.co.kr%20%EC%8A%A4%ED%8F%AC%EC%B8%A0&hl=ko&gl=KR&ceid=KR%3Ako", 'section': "스포츠"},
    {'source': "동아일보", 'source_domain': "donga.com", 'side': "RIGHT", 'url': "https://rss.donga.com/politics.xml", 'section': "정치"},
    {'source': "동아일보", 'source_domain': "donga.com", 'side': "RIGHT", 'url': "https://rss.donga.com/economy.xml", 'section': "경제"},
    {'source': "동아일보", 'source_domain': "donga.com", 'side': "RIGHT", 'url': "https://rss.donga.com/national.xml", 'section': "사회"},
    {'source': "동아일보", 'source_domain': "donga.com", 'side': "RIGHT", 'url': "https://rss.donga.com/culture.xml", 'section': "문화"},
    {'source': "동아일보", 'source_domain': "donga.com", 'side': "RIGHT", 'url': "https://rss.donga.com/sports.xml", 'section': "스포츠"},
]

# --- 고급 HTTP 세션 설정 ---
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
def normalize_datetime_to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        dt = dt.replace(tzinfo=KST)
    return dt.astimezone(timezone.utc)

def resolve_google_news_url(url: str) -> str:
    if 'news.google.com' in url:
        try:
            session = get_http_session()
            response = session.head(url, allow_redirects=True, timeout=8)
            return response.url
        except requests.RequestException:
            return url
    return url
def scrape_og_image(url: str) -> Optional[str]:
    try:
        session = get_http_session()
        response = session.get(url, timeout=8)
        soup = BeautifulSoup(response.content, 'html.parser')
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content', '').startswith('http'):
            return og_image['content']
    except requests.RequestException:
        pass
    return None

def scrape_meta_description(url: str) -> Optional[str]:
    try:
        session = get_http_session()
        response = session.get(url, timeout=8)
        soup = BeautifulSoup(response.content, 'html.parser')
        meta_description = soup.find('meta', attrs={'name': 'description'})
        if meta_description and meta_description.get('content'):
            return meta_description['content']
    except requests.RequestException:
        pass
    return None

def clean_title(title: str) -> str:
    if not title: return ''
    
    # 1. 지역 정보 제거 (등호 포함): [서울=뉴시스], (부산=연합뉴스) 등
    title = re.sub(r'[\[\(][^=\[\]\(\)]*=[^=\[\]\(\)]*[\]\)]', '', title)
    
    # 2. 언론사명 제거 (맨 끝에 있는 경우)
    publisher_regex = re.compile(r'\s*[-–—|]\s*(중앙일보|조선일보|동아일보|한겨레|경향신문|오마이뉴스|연합뉴스|뉴시스|joongang|chosun|donga|hani|khan|yna|newsis)\s*$', re.I)
    title = publisher_regex.sub('', title)
    
    return title.strip()

def scrape_hankyoreh_publication_time(url: str) -> Optional[datetime]:
    try:
        session = get_http_session()
        response = session.get(url, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        date_li = soup.find(lambda tag: tag.name == 'li' and '등록' in tag.get_text())
        if date_li:
            date_span = date_li.find('span')
            if date_span:
                return dt_parse(date_span.get_text())
    except Exception as e:
        logging.warning(f"[Scraper] Failed to scrape Hankyoreh date for {url}: {e}")
    return None

def _normalize_image_url(candidate: Optional[str], base_url: str) -> Optional[str]:
    if not candidate:
        return None
    candidate = candidate.strip()
    if not candidate:
        return None
    if candidate.startswith("//"):
        candidate = f"https:{candidate}"
    return urljoin(base_url, candidate)

def _get_donga_high_res_url(url: str) -> str:
    if "dimg.donga.com" in url:
        return re.sub(r'/i/\d+/\d+/\d+/', '/', url)
    return url

def fetch_and_parse_feed(feed_info: Dict[str, Any]) -> List[Dict[str, Any]]:
    articles = []
    try:
        session = get_http_session()
        response = session.get(feed_info['url'], timeout=15)
        response.encoding = 'utf-8'
        parsed_feed = feedparser.parse(response.text)

        for item in parsed_feed.entries:
            if not item.get('link') or not item.get('title'):
                continue

            # Start with the link from the feed
            final_url = item.link
            description_html = item.get('description', item.get('summary', ''))

            # If it's a Google News link, extract the real URL from the description
            if 'news.google.com' in final_url:
                try:
                    soup = BeautifulSoup(description_html, 'html.parser')
                    link_tag = soup.find('a')
                    if link_tag and link_tag.get('href'):
                        final_url = link_tag.get('href')
                        # logging.info(f"Resolved Google News URL to: {final_url}")
                except Exception as e:
                    logging.warning(f"Could not parse real URL from Google News description: {e}")
                    # Fallback to the old resolver if parsing fails
                    final_url = resolve_google_news_url(item.link)
            
            cleaned_title = clean_title(item.title)
            final_title = html.unescape(html.unescape(cleaned_title))
            
            # HTML 태그 제거 후 엔티티 변환 (&apos;, &middot;, &nbsp; 등)
            description_text = re.sub('<[^<]+?>', '', description_html).strip()
            description_text = html.unescape(description_text)
            
            # Remove author/source tags like [OSEN=조형래 기자], (OSEN=조형래 기자), [스포츠조선 나유리 기자]
            # Pattern 1: [XXX=기자이름 기자] or (XXX=기자이름 기자)
            description_text = re.sub(r'[\[\(][^=\[\]\(\)]*=[^\]\)]+[\]\)]', '', description_text).strip()
            # Pattern 2: [스포츠조선 기자이름 기자], [조선일보 기자이름 기자] 등
            description_text = re.sub(r'[\[\(](스포츠조선|조선일보|동아일보|중앙일보|경향신문|한겨레|연합뉴스|뉴시스|오마이뉴스)\s*[^\]]+기자[\]\)]', '', description_text).strip()
            
            source_name = feed_info['source']

            # For Yonhap, Newsis, and Chosun Ilbo, remove the initial reporter tag
            if source_name in ['연합뉴스', '뉴시스', '조선일보']:
                # Pattern: 기자이름 기자 = ...
                description_text = re.sub(r'^.*?기자\s*=\s*', '', description_text).strip()
                # Pattern: [기자이름 기자] or 기자이름 기자 at the start
                description_text = re.sub(r'^[\[\(]?[가-힣]+\s*기자[\]\)]?\s*[=\-–]\s*', '', description_text).strip()
            
            # If description is empty for Hankyoreh or Chosun Ilbo, try to scrape meta description
            if not description_text and source_name in ['한겨레', '조선일보']:
                scraped_description = scrape_meta_description(final_url)
                if scraped_description:
                    description_text = scraped_description
            
            published_time_utc: Optional[datetime] = None

            if source_name == '한겨레':
                scraped_time = scrape_hankyoreh_publication_time(final_url)
                if scraped_time:
                    published_time_utc = normalize_datetime_to_utc(scraped_time)

            if not published_time_utc:
                time_struct = item.get('published_parsed') or item.get('updated_parsed')
                if time_struct:
                    utc_timestamp = calendar.timegm(time_struct)
                    published_time_utc = datetime.fromtimestamp(utc_timestamp, tz=timezone.utc)

            if not published_time_utc:
                date_string = item.get('published') or item.get('updated') or item.get('dc_date')
                if date_string:
                    try:
                        parsed_time = dt_parse(date_string)
                        published_time_utc = normalize_datetime_to_utc(parsed_time)
                    except (ValueError, TypeError):
                        pass
            
            if not published_time_utc:
                published_time_utc = datetime.now(timezone.utc)

            if published_time_utc < (datetime.now(timezone.utc) - timedelta(days=1)):
                continue

            thumbnail_url: Optional[str] = None

            # For JoongAng Ilbo, prioritize scraping the high-quality og:image first.
            if feed_info['source'] == '중앙일보':
                thumbnail_url = scrape_og_image(final_url)

            # Fallback for other sources or if JoongAng scraping fails
            if not thumbnail_url and hasattr(item, 'media_thumbnail') and item.media_thumbnail:
                thumbnail_url = item.media_thumbnail[0].get('url')
            
            if not thumbnail_url and hasattr(item, 'media_content') and item.media_content:
                for media in item.media_content:
                    if media.get('medium') == 'image' and media.get('url'):
                        thumbnail_url = media.get('url')
                        break
            
            if not thumbnail_url and description_html:
                img_match = re.search(r'<img[^>]+src=["\"]([^"\"]+)["\"]', description_html)
                if img_match:
                    thumbnail_url = img_match.group(1)

            # Generic fallback to scrape og:image if no thumbnail has been found yet
            if not thumbnail_url:
                thumbnail_url = scrape_og_image(final_url)

            if thumbnail_url:
                thumbnail_url = _normalize_image_url(thumbnail_url, final_url)
                if thumbnail_url and "donga.com" in final_url:
                    thumbnail_url = _get_donga_high_res_url(thumbnail_url)
            
            if not thumbnail_url:
                thumbnail_url = LOGO_FALLBACK_MAP.get(source_name)

            articles.append({
                'source': feed_info['source'],
                'source_domain': feed_info['source_domain'],
                'side': feed_info['side'],
                'category': feed_info['section'],
                'title': final_title,
                'url': final_url,
                'published_at': published_time_utc,
                'thumbnail_url': thumbnail_url,
                'description': description_text
            })
    except Exception as e:
        logging.error(f"{feed_info['source']}' 피드 처리 실패: {e}")
    return articles

# --- 알림 발송 함수 ---
def send_notification(notification_type: str, article: Dict[str, Any]):
    """내부 알림 API를 호출하여 실시간 알림을 요청합니다."""
    if not INTERNAL_API_URL:
        return

    payload = {
        "notification_type": notification_type,
        "data": {
            "title": article.get('title'),
            "url": article.get('url'),
            "source": article.get('source'),
            "source_domain": article.get('source_domain'),
            "thumbnail_url": article.get('thumbnail_url'),
            "published_at": article.get('published_at').isoformat() if article.get('published_at') else None,
        }
    }
    try:
        response = requests.post(INTERNAL_API_URL, json=payload, timeout=5)
        response.raise_for_status() # 2xx 응답이 아니면 에러 발생
        logging.info(f"[Notification] Sent {notification_type} notification for article: {article.get('title')}")
    except requests.RequestException as e:
        logging.error(f"[Notification] Failed to send notification: {e}")

# --- 메인 로직 ---
def main():
    logging.info("--- 최신 기사 병렬 수집 시작 ---")
    all_articles = []

    logging.info("Step 1: Starting parallel feed fetching...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_feed = {executor.submit(fetch_and_parse_feed, feed): feed for feed in FEEDS}
        for future in concurrent.futures.as_completed(future_to_feed):
            try:
                articles_from_feed = future.result()
                if articles_from_feed:
                    all_articles.extend(articles_from_feed)
            except Exception as exc:
                feed_info = future_to_feed[future]
                logging.error(f"{feed_info['source']} 피드 처리 중 예외 발생: {exc}")

    logging.info(f"Step 2: Completed parsing for a total of {len(all_articles)} articles.")

    # 여러 피드에서 동일한 기사가 수집되었을 수 있으므로 URL 기준으로 중복 제거
    unique_articles_map = {article['url']: article for article in all_articles}
    all_articles = list(unique_articles_map.values())
    logging.info(f"Step 2.5: Found {len(all_articles)} unique articles after de-duplication.")

    if not all_articles:
        logging.info("No new articles to save. Exiting.")
        return

    try:
        logging.info("Step 3: Attempting to connect to the database...")
        cnx = mysql.connector.connect(**DB_CONFIG)
        cursor = cnx.cursor(dictionary=True)
        logging.info("Step 4: Database connection successful.")

        # 기존에 저장된 URL 목록을 가져와서 중복 체크
        cursor.execute("SELECT url FROM tn_home_article")
        existing_urls = {row['url'] for row in cursor.fetchall()}
        
        new_articles = [a for a in all_articles if a['url'] not in existing_urls]

        logging.info(f"Step 5: Found {len(new_articles)} new articles to save and notify.")

        if new_articles:
            # ===== 속보/단독 뉴스 자동 알림 (비활성화) =====
            # 활성화하려면 아래 주석을 해제하세요
            # for article in new_articles:
            #     title = article.get('title', '')
            #     if '[속보]' in title:
            #         send_notification('BREAKING_NEWS', article)
            #     elif '[단독]' in title:
            #         send_notification('EXCLUSIVE_NEWS', article)

            # DB 저장 로직
            insert_query = "INSERT INTO tn_home_article (source, source_domain, side, category, title, url, published_at, thumbnail_url, description) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
            data_to_insert = [(a['source'], a['source_domain'], a['side'], a['category'], a['title'], a['url'], a['published_at'].strftime('%Y-%m-%dT%H:%M:%SZ'), a['thumbnail_url'], a['description']) for a in new_articles]
            cursor.executemany(insert_query, data_to_insert)
            cnx.commit()
            logging.info(f"Step 6: {cursor.rowcount} new articles saved successfully.")

    except mysql.connector.Error as err:
        logging.error(f"DB 오류 발생: {err}")
        sys.exit(1)
    finally:
        if 'cnx' in locals() and cnx.is_connected():
            cursor.close()
            cnx.close()

if __name__ == "__main__":
    main()
