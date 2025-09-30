
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
article_collector_final.py
- Robust collector for published topics
- Keyword regex (relaxed spacing + variants + optional EN)
- Query/passages embeddings separation (E5 family)
- Safe similarity index mapping
- Global deadline + IO timeouts + scan cap
- Optional thumbnail fetch (timeout; can be disabled)
- INSERT IGNORE + status updates
"""

import os
import sys
import re
import json
import time
import logging
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse, parse_qs, urljoin

import feedparser
import numpy as np
from sentence_transformers import SentenceTransformer
from itertools import product
from tqdm import tqdm
import mysql.connector
from dateutil.parser import parse as dt_parse
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# ---------------- Config ----------------
MODEL_NAME = os.getenv("EMBED_MODEL", "intfloat/multilingual-e5-base")
TIME_WINDOW_HOURS = int(os.getenv("TIME_WINDOW_HOURS", "72"))
TARGET_PER_SIDE = int(os.getenv("TARGET_ARTICLES_PER_SIDE", "10"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.80"))
GLOBAL_DEADLINE = int(os.getenv("COLLECT_DEADLINE", "900"))  # 15 min
MAX_SCAN_CANDIDATES = int(os.getenv("MAX_SCAN_CANDIDATES", "300"))
REQUEST_TIMEOUT = (int(os.getenv("HTTP_CONNECT_TIMEOUT", "4")),
                   int(os.getenv("HTTP_READ_TIMEOUT", "8")))
SKIP_THUMBNAILS = os.getenv("SKIP_THUMBNAILS", "false").lower() == "true"
INCLUDE_ENGLISH_SYNONYMS = os.getenv("INCLUDE_EN_SYNONYMS", "true").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "dn"),
    "password": os.getenv("DB_PASSWORD", "dnpass"),
    "database": os.getenv("DB_NAME", "different_news"),
    "autocommit": True,
}

KST = timezone(timedelta(hours=9))

Side = str

@dataclass
class Feed:
    source: str
    source_domain: str
    side: Side
    url: str
    section: str

FEEDS: List[Feed] = [
    # LEFT
    Feed("경향신문", "khan.co.kr", "LEFT", "https://www.khan.co.kr/rss/rssdata/politic_news.xml", "정치"),
    Feed("경향신문", "khan.co.kr", "LEFT", "https://www.khan.co.kr/rss/rssdata/economy_news.xml", "경제"),
    Feed("경향신문", "khan.co.kr", "LEFT", "https://www.khan.co.kr/rss/rssdata/society_news.xml", "사회"),
    Feed("경향신문", "khan.co.kr", "LEFT", "https://www.khan.co.kr/rss/rssdata/culture_news.xml", "문화"),
    Feed("한겨레",   "hani.co.kr", "LEFT", "https://www.hani.co.kr/rss/politics/", "정치"),
    Feed("한겨레",   "hani.co.kr", "LEFT", "https://www.hani.co.kr/rss/economy/", "경제"),
    Feed("한겨레",   "hani.co.kr", "LEFT", "https://www.hani.co.kr/rss/society/", "사회"),
    Feed("한겨레",   "hani.co.kr", "LEFT", "https://www.hani.co.kr/rss/culture/", "문화"),
    Feed("오마이뉴스", "ohmynews.com", "LEFT", "http://rss.ohmynews.com/rss/politics.xml", "정치"),
    Feed("오마이뉴스", "ohmynews.com", "LEFT", "http://rss.ohmynews.com/rss/economy.xml", "경제"),
    Feed("오마이뉴스", "ohmynews.com", "LEFT", "http://rss.ohmynews.com/rss/society.xml", "사회"),
    Feed("오마이뉴스", "ohmynews.com", "LEFT", "http://rss.ohmynews.com/rss/culture.xml", "문화"),
    # RIGHT
    Feed("조선일보", "chosun.com", "RIGHT", "https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml", "정치"),
    Feed("조선일보", "chosun.com", "RIGHT", "https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml", "경제"),
    Feed("조선일보", "chosun.com", "RIGHT", "https://www.chosun.com/arc/outboundfeeds/rss/category/society/?outputType=xml", "사회"),
    Feed("조선일보", "chosun.com", "RIGHT", "https://www.chosun.com/arc/outboundfeeds/rss/category/culture/?outputType=xml", "문화"),
    Feed("중앙일보", "joongang.co.kr", "RIGHT", "https://news.google.com/rss/search?q=site:joongang.co.kr%20정치&hl=ko&gl=KR&ceid=KR%3Ako", "정치"),
    Feed("중앙일보", "joongang.co.kr", "RIGHT", "https://news.google.com/rss/search?q=site:joongang.co.kr%20경제&hl=ko&gl=KR&ceid=KR%3Ako", "경제"),
    Feed("중앙일보", "joongang.co.kr", "RIGHT", "https://news.google.com/rss/search?q=site:joongang.co.kr%20사회&hl=ko&gl=KR&ceid=KR%3Ako", "사회"),
    Feed("중앙일보", "joongang.co.kr", "RIGHT", "https://news.google.com/rss/search?q=site:joongang.co.kr%20문화&hl=ko&gl=KR&ceid=KR%3Ako", "문화"),
    Feed("동아일보", "donga.com", "RIGHT", "https://rss.donga.com/politics.xml", "정치"),
    Feed("동아일보", "donga.com", "RIGHT", "https://rss.donga.com/economy.xml", "경제"),
    Feed("동아일보", "donga.com", "RIGHT", "https://rss.donga.com/national.xml", "사회"),
    Feed("동아일보", "donga.com", "RIGHT", "https://rss.donga.com/culture.xml", "문화"),
]

@dataclass
class Article:
    source: str
    source_domain: str
    side: Side
    title: str
    url: str
    published_at: Optional[datetime]
    section: str
    rss_desc: Optional[str] = None
    similarity: float = 0.0
    thumbnail_url: Optional[str] = None

# ------------- Utils ----------------
# [수정] 로그 파일 경로를 스크립트 위치 기준으로 고정
LOG_FILE_PATH = os.path.join(os.path.dirname(__file__), 'collector.log')
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE_PATH, mode='a', encoding='utf-8'),
        logging.StreamHandler() # 콘솔에도 로그 출력
    ]
)

def now_kst() -> datetime:
    return datetime.now(KST)


def now_kst_naive() -> datetime:
    return datetime.now(KST).replace(tzinfo=None)


def to_kst_naive(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(KST).replace(tzinfo=None)

# SentenceTransformer cache
_MODEL = None
def get_model():
    global _MODEL
    if _MODEL is None:
        _MODEL = SentenceTransformer(MODEL_NAME)
    return _MODEL

def embed_texts(texts: List[str], is_query: bool = False) -> np.ndarray:
    """E5-style: use 'query:' vs 'passage:' prefixes, normalize outputs"""
    model = get_model()
    prefix = "query: " if is_query else "passage: "
    prefixed = [f"{prefix}{t[:512]}" for t in texts]
    vecs = model.encode(prefixed, batch_size=128, show_progress_bar=True, normalize_embeddings=True)
    return np.asarray(vecs, dtype=np.float32)

# HTTP session with retries + timeouts
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
retries = Retry(total=1, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504])
_session_local = threading.local()

def _create_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({"User-Agent": "DifferentNewsBot/1.0"})
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

def fetch_html(url: str) -> Optional[str]:
    try:
        session = get_http_session()
        r = session.get(url, timeout=REQUEST_TIMEOUT)
        if r.ok:
            return r.text
    except requests.RequestException:
        return None
    return None

def resolve_article_url(raw_url: str, source_domain: str) -> str:
    url = text_norm(raw_url)
    if not url:
        return url

    parsed = urlparse(url)
    netloc = parsed.netloc.lower()
    if "news.google." in netloc:
        qs = parse_qs(parsed.query)
        candidates = qs.get("url")
        if candidates:
            candidate = text_norm(candidates[0])
            if candidate:
                return candidate
        session = get_http_session()
        try:
            resp = session.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        except requests.RequestException:
            pass
        else:
            try:
                final_url = getattr(resp, "url", None)
                if final_url:
                    return text_norm(final_url)
            finally:
                resp.close()
    return url

def scrape_thumbnail_url(article_url: str) -> Optional[str]:
    if SKIP_THUMBNAILS:
        return None
    html = fetch_html(article_url)
    if not html:
        return None
    soup = BeautifulSoup(html, "html.parser")
    domain = urlparse(article_url).netloc.lower()

    if "joongang.co.kr" in domain:
        thumb = extract_joongang_thumbnail(soup, article_url)
        if thumb:
            return thumb

    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        normalized = _normalize_image_url(og.get("content"), article_url)
        if normalized:
            return normalized

    twitter = soup.find("meta", attrs={"name": "twitter:image"})
    if twitter and twitter.get("content"):
        normalized = _normalize_image_url(twitter.get("content"), article_url)
        if normalized:
            return normalized

    return None


def scrape_publication_time(article_url: str) -> Optional[datetime]:
    """한겨레(hani.co.kr) 기사 URL에 접속하여 발행 시각을 스크레이핑합니다."""
    html = fetch_html(article_url)
    if not html:
        return None
    try:
        soup = BeautifulSoup(html, "html.parser")
        # 한겨레는 'p.date-time' 클래스에 날짜 정보가 있음
        date_element = soup.select_one('p.date-time')
        if date_element:
            date_text = date_element.get_text()
            # 정규식으로 '등록 2024.05.24 14:30' 같은 패턴을 찾음
            match = re.search(r'등록\s*(\d{4}[-.]\d{2}[-.]\d{2}\s\d{2}:\d{2})', date_text)
            if match:
                # dt_parse를 사용하여 datetime 객체로 변환
                return to_kst_naive(dt_parse(match.group(1)))
    except Exception as e:
        logging.warning(f"[Scrape] Publication time scraping failed for {article_url}: {e}")
    return None


def text_norm(s: Optional[str]) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def _normalize_image_url(candidate: Optional[str], base_url: str) -> Optional[str]:
    if not candidate:
        return None
    candidate = candidate.strip()
    if not candidate:
        return None
    if candidate.startswith("//"):
        candidate = f"https:{candidate}"
    return urljoin(base_url, candidate)


def _extract_image_from_json(obj):
    if isinstance(obj, str):
        return obj
    if isinstance(obj, list):
        for item in obj:
            result = _extract_image_from_json(item)
            if result:
                return result
        return None
    if isinstance(obj, dict):
        for key in ("image", "imageUrl", "imageURL", "thumbnailUrl", "contentUrl"):
            if key in obj:
                result = _extract_image_from_json(obj[key])
                if result:
                    return result
        for value in obj.values():
            result = _extract_image_from_json(value)
            if result:
                return result
    return None


def canonicalize_url(url: Optional[str]) -> Optional[str]:
    cleaned = text_norm(url) if url else ""
    if not cleaned:
        return None
    parsed = urlparse(cleaned)
    domain = parsed.netloc.lower()
    return text_norm(resolve_article_url(cleaned, domain))


def extract_joongang_thumbnail(soup: BeautifulSoup, article_url: str) -> Optional[str]:
    meta_selectors = [
        ("meta[property='og:image']", "content"),
        ("meta[property='twitter:image']", "content"),
        ("meta[name='image']", "content"),
        ("link[rel='image_src']", "href"),
    ]
    for selector, attr in meta_selectors:
        tag = soup.select_one(selector)
        if tag and tag.get(attr):
            normalized = _normalize_image_url(tag.get(attr), article_url)
            if normalized:
                return normalized

    for img in soup.select("figure img, .article-photo img, .article-image img, .ab_photo img"):
        candidate = img.get("data-src") or img.get("data-original") or img.get("src")
        normalized = _normalize_image_url(candidate, article_url)
        if normalized:
            return normalized

    for script in soup.find_all("script", type="application/ld+json"):
        raw = (script.string or script.text or "").strip()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except Exception:
            continue
        candidate = _extract_image_from_json(data)
        normalized = _normalize_image_url(candidate, article_url)
        if normalized:
            return normalized

    pattern = re.search(r'"imageUrl"\s*:\s*"(https?://[^"\\]+)"', soup.text)
    if pattern:
        normalized = _normalize_image_url(pattern.group(1), article_url)
        if normalized:
            return normalized

    return None

def clean_title_for_source(title: str, source_domain: str) -> str:
    if not title:
        return title
    # 공백 정리
    t = re.sub(r"\s+", " ", title).strip()

    # 1) 끝 꼬리표: " - 중앙일보", "| 조선일보", " : 한겨레" 등 제거
    publisher_rx = r"(중앙일보|조선일보|동아일보|한겨레|경향신문|오마이뉴스|joongang|chosun|donga|hani|khan)"
    t = re.sub(rf"\s*[-–—|:]\s*{publisher_rx}\s*$", "", t, flags=re.I)

    # 2) [속보], (종합), [포토], (영상) 같은 꼬리표 제거
    t = re.sub(r"\s*[\[\(](속보|단독|포토|영상|종합)[\]\)]\s*$", "", t)

    return t.strip()

# ------------- Keyword Matching -------------

SYNONYM_GROUPS = {
    "???": ["???", "??", "???"],
    "??": ["??", "???", "???"],
    "???": ["???", "???", "??"],
    "???": ["???", "???"],
    "???": ["???", "???"],
}
_KNOWN_TOKEN_CATALOG = sorted({*SYNONYM_GROUPS.keys(), "??"}, key=len, reverse=True)

def _decompose_keyword(keyword: str):
    if not keyword:
        return []
    for token in _KNOWN_TOKEN_CATALOG:
        if keyword.startswith(token):
            remainder = keyword[len(token):]
            if not remainder:
                return [token]
            tail = _decompose_keyword(remainder)
            if tail is not None:
                return [token] + tail
    return None

def _split_keyword_tokens(keyword: str) -> List[str]:
    keyword = keyword.strip()
    if not keyword:
        return []
    if re.search(r"\s", keyword):
        return [t for t in re.split(r"\s+", keyword) if t]
    decomposed = _decompose_keyword(keyword)
    if decomposed:
        return decomposed
    return [keyword]

def build_keyword_patterns(initial_keywords: List[str]) -> List[re.Pattern]:
    """Relax spacing; allow common spelling variants; optional English synonyms"""
    variants = set()
    for kw in initial_keywords:
        k = kw.strip()
        if not k:
            continue
        # relaxed spacing
        variants.add(re.escape(k).replace(r" ", r"\s*"))

        # if two or more tokens, ensure flexible spacing
        parts = re.split(r"\s+", k)
        if len(parts) >= 2:
            variants.add(r"\s*".join(map(re.escape, parts)))
    if INCLUDE_ENGLISH_SYNONYMS:
        variants.update([r"currency\s*swap", r"dollar\s*swap", r"FX\s*swap"])
    return [re.compile(v, re.I) for v in variants]


TOKEN_PAIRS = [
    ["??", "???"],
    ["??", "??"],
    ["??", "???"],
    ["???", "???"],
    ["???", "??"],
    ["???", "???"],
]




def cooccur_pass(title: str, desc: Optional[str]) -> bool:
    text = f"{title} {desc or ''}"
    return any(sum(t in text for t in pair) >= 2 for pair in TOKEN_PAIRS)

def lexical_match(title: str, desc: Optional[str], patterns: List[re.Pattern]) -> bool:
    text = f"{title} {desc or ''}"
    return any(p.search(text) for p in patterns)

# ------------- RSS Pull -------------
def pull_feeds() -> List[Article]:
    all_articles: List[Article] = []
    unique = set()
    for f in tqdm(FEEDS, desc="📰 RSS"):
        feed = feedparser.parse(f.url)
        for entry in feed.entries:
            raw_title = text_norm(getattr(entry, "title", ""))
            title = clean_title_for_source(raw_title, f.source_domain)
            if not title or title in unique:
                continue
            unique.add(title)
            link = None
            for link_obj in getattr(entry, "links", []):
                href_raw = link_obj.get("href")
                href = text_norm(href_raw) if href_raw else ""
                if href and link_obj.get("type") == "text/html":
                    link = href
                    break
            if not link:
                link = text_norm(getattr(entry, "link", ""))

            link = text_norm(resolve_article_url(link or "", f.source_domain))
            if not link:
                continue

            published_str = getattr(entry, "published", None) or getattr(entry, "updated", None)
            published_dt: Optional[datetime] = None
            is_hankyoreh = f.source_domain == 'hani.co.kr'

            if published_str and not is_hankyoreh:
                try:
                    parsed_dt = dt_parse(published_str)
                    if parsed_dt.tzinfo is not None:
                        published_dt = parsed_dt.astimezone(KST).replace(tzinfo=None)
                    else:
                        published_dt = parsed_dt
                except Exception:
                    published_dt = None  # 파싱 실패 시 None으로 유지

            if published_dt and not is_hankyoreh:
                published_dt = to_kst_naive(published_dt)

            desc = re.sub(r"<[^>]+>", " ", getattr(entry, "summary", "") or "")
            all_articles.append(Article(
                source=f.source,
                source_domain=f.source_domain,
                side=f.side,
                title=title,
                url=link,
                published_at=published_dt,
                section=f.section,
                rss_desc=text_norm(desc),
            ))
        time.sleep(0.05)
    return all_articles

# ------------- DB Helpers -------------
def get_published_topics(cursor, target_topic_id: Optional[int] = None) -> List[Dict]:
    if target_topic_id:
        cursor.execute("SELECT * FROM topics WHERE id=%s AND status='published' LIMIT 1", (target_topic_id,))
        rows = cursor.fetchall()
    else:
        cursor.execute("SELECT * FROM topics WHERE status='published'")
        rows = cursor.fetchall()
    return rows

def get_existing_urls_for_topic(cursor, topic_id: int) -> tuple[set, set]:
    cursor.execute("SELECT url, status FROM articles WHERE topic_id=%s", (topic_id,))
    rows = cursor.fetchall()
    all_urls: set[str] = set()
    blocked_urls: set[str] = set()
    for row in rows:
        raw_url = text_norm(row.get("url"))
        if raw_url:
            all_urls.add(raw_url)
            canonical = canonicalize_url(raw_url)
            if canonical:
                all_urls.add(canonical)
            if row.get("status") in {"published", "deleted"}:
                blocked_urls.add(raw_url)
                if canonical:
                    blocked_urls.add(canonical)
    return all_urls, blocked_urls

def insert_article(cursor, topic_id: int, a: Article, display_order: int = 0):
    cursor.execute(
        """
        INSERT IGNORE INTO articles
        (topic_id, source, source_domain, side, title, url, published_at, similarity, status, rss_desc, thumbnail_url, is_featured, display_order)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'suggested',%s,%s,0,%s)
        """,
        (
            topic_id, a.source, a.source_domain, a.side, a.title, a.url,
            a.published_at, float(a.similarity), a.rss_desc, a.thumbnail_url, display_order
        )
    )

def update_collection_status(cursor, topic_id: int, status: str):
    cursor.execute("UPDATE topics SET collection_status=%s, updated_at=NOW() WHERE id=%s", (status, topic_id))

# ------------- Main -------------
def collect_for_topic(cnx, topic: Dict, deadline_ts: float):
    topic_id = int(topic["id"])
    display_name = topic.get("display_name") or topic.get("core_keyword")
    logging.info(f"▶ Collect for topic #{topic_id} '{display_name}'")

    # Parse keywords
    raw_kw = (topic.get("search_keywords") or topic.get("core_keyword") or "").strip()
    if not raw_kw:
        logging.warning("  ↳ No search_keywords/core_keyword; skip")
        return

    initial_keywords = [s.strip() for s in raw_kw.split(",") if s.strip()]
    patterns = build_keyword_patterns(initial_keywords)

    # Pull recent articles
    articles = pull_feeds()
    # Filter by time window first
    since = now_kst_naive() - timedelta(hours=TIME_WINDOW_HOURS)
    articles = [a for a in articles if not a.published_at or a.published_at >= since]

    if not articles:
        logging.warning("  ↳ No recent articles in window")
        return

    # Embeddings: articles(passages) + query(keywords)
    passage_vecs = embed_texts([a.title for a in articles], is_query=False)
    query_vecs = embed_texts(initial_keywords, is_query=True)

    sims = (passage_vecs @ query_vecs.T)  # cosine because normalized
    max_sim = sims.max(axis=1)

    # Safe mapping: use exact same order as 'articles'
    candidates: List[Article] = []
    for i, a in enumerate(articles):
        a.similarity = float(max_sim[i])
        # accept if (regex OR co-occurrence OR embedding)
        if lexical_match(a.title, a.rss_desc, patterns) or cooccur_pass(a.title, a.rss_desc) or a.similarity >= SIMILARITY_THRESHOLD:
            candidates.append(a)

    # Remove URLs already saved for this topic
    cursor = cnx.cursor(dictionary=True)
    existing_urls, blocked_urls = get_existing_urls_for_topic(cursor, topic_id)
    candidates = [a for a in candidates if a.url not in blocked_urls]
    candidates = [a for a in candidates if a.url not in existing_urls]

    # [수정] DB에서 현재 토픽에 속한 기사 수를 먼저 카운트
    cursor.execute(
        "SELECT side, COUNT(*) as count FROM articles WHERE topic_id = %s AND status IN ('published', 'suggested') GROUP BY side",
        (topic_id,)
    )
    existing_counts = {row['side']: row['count'] for row in cursor.fetchall()}
    left_needed = TARGET_PER_SIDE - existing_counts.get("LEFT", 0)
    right_needed = TARGET_PER_SIDE - existing_counts.get("RIGHT", 0)

    logging.info(f"  ↳ Existing: L={existing_counts.get('LEFT', 0)}, R={existing_counts.get('RIGHT', 0)}. Needed: L={left_needed}, R={right_needed}")

    if left_needed <= 0 and right_needed <= 0:
        logging.info("  ↳ No new articles needed. Skipping scan.")
        update_collection_status(cursor, topic_id, "completed")
        return

    # Rank by sim desc (secondary: recent first)
    candidates.sort(key=lambda x: (x.similarity, x.published_at or datetime.min), reverse=True)

    # Scan with caps and deadline
    left, right = [], []
    scanned = 0
    for a in candidates:
        if time.time() >= deadline_ts:
            logging.warning("⏰ Deadline reached while scanning candidates")
            break
        if scanned >= MAX_SCAN_CANDIDATES:
            logging.warning("🚧 Scan cap reached")
            break
        scanned += 1
        if a.side == "LEFT" and len(left) < left_needed:
            left.append(a)
        elif a.side == "RIGHT" and len(right) < right_needed:
            right.append(a)
        if len(left) >= left_needed and len(right) >= right_needed:
            break

    # Fetch thumbnails (optional, parallel)
    if not SKIP_THUMBNAILS:
        with ThreadPoolExecutor(max_workers=8) as ex:
            futures = {ex.submit(scrape_thumbnail_url, a.url): a for a in (left + right)}
            for fut in as_completed(futures):
                a = futures[fut]
                try:
                    a.thumbnail_url = fut.result()
                except Exception:
                    a.thumbnail_url = None

    # Insert
    update_collection_status(cursor, topic_id, "collecting")
    orders = {"LEFT": 0, "RIGHT": 0}
    for a in (left + right):
        orders[a.side] += 1
        insert_article(cursor, topic_id, a, display_order=orders[a.side])
    update_collection_status(cursor, topic_id, "completed")
    logging.info(f"✓ Topic #{topic_id} done: LEFT {len(left)} / RIGHT {len(right)} (scanned {scanned})")

def main():
    logging.info("--- Article Collector (final) ---")
    target_topic_id = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else None
    start_ts = time.time()
    deadline_ts = start_ts + GLOBAL_DEADLINE

    cnx = None
    try:
        cnx = mysql.connector.connect(**DB_CONFIG)
        cursor = cnx.cursor(dictionary=True)
        logging.info("DB connected.")

        topics = get_published_topics(cursor, target_topic_id)
        if not topics:
            logging.warning("No published topics to collect.")
            return

        for t in topics:
            if time.time() >= deadline_ts:
                logging.warning("⏰ Global deadline reached. Stopping.")
                break
            try:
                collect_for_topic(cnx, t, deadline_ts)
            except Exception as e:
                logging.exception(f"Topic #{t.get('id')} failed: {e}")
                try:
                    update_collection_status(cursor, int(t.get('id')), "failed")
                except Exception:
                    pass

    finally:
        if cnx:
            cnx.close()
        took = time.time() - start_ts
        logging.info(f"All done in {took:.1f}s")

if __name__ == "__main__":
    main()
