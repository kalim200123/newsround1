#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
article_collector_final.py
- SOURCE CHANGED: Now reads from tn_home_article table instead of pulling RSS feeds directly.
- This script analyzes a pool of recent articles (collected by home_article_collector.py)
  and suggests relevant ones for specific topics using an AI similarity model.
"""

import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

import sys
import re
import logging
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime, timedelta, timezone

import numpy as np
from sentence_transformers import SentenceTransformer
import mysql.connector

# ---------------- Config ----------------
MODEL_NAME = os.getenv("EMBED_MODEL", "dragonkue/multilingual-e5-small-ko")
TIME_WINDOW_HOURS = int(os.getenv("TIME_WINDOW_HOURS", "24"))
TARGET_PER_SIDE = int(os.getenv("TARGET_ARTICLES_PER_SIDE", "20"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.78"))
GLOBAL_DEADLINE = int(os.getenv("COLLECT_DEADLINE", "900"))  # 15 min
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_DATABASE"),
    "autocommit": True
}

if os.getenv("DB_SSL_ENABLED") == 'true':
    is_production = os.getenv('NODE_ENV') == 'production'
    if is_production:
        DB_CONFIG["ssl_ca"] = "/etc/ssl/certs/ca-certificates.crt"
        DB_CONFIG["ssl_verify_cert"] = True
    else:
        DB_CONFIG["ssl_verify_cert"] = False

@dataclass
class Article:
    source: str
    source_domain: str
    side: str
    title: str
    url: str
    published_at: Optional[datetime]
    rss_desc: Optional[str]
    thumbnail_url: Optional[str]
    similarity: float = 0.0

# ------------- Utils ----------------
LOG_FILE_PATH = os.path.join(os.path.dirname(__file__), 'collector.log')
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE_PATH, mode='a', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# SentenceTransformer cache
_MODEL = None
def get_model():
    global _MODEL
    if _MODEL is None:
        logging.info(f"Loading AI similarity model: {MODEL_NAME}...")
        _MODEL = SentenceTransformer(MODEL_NAME)
        logging.info("Model loaded.")
    return _MODEL

def embed_texts(texts: List[str], is_query: bool = False) -> np.ndarray:
    model = get_model()
    prefix = "query: " if is_query else "passage: "
    prefixed = [f"{prefix}{t[:512]}" for t in texts]
    vecs = model.encode(prefixed, batch_size=128, normalize_embeddings=True)
    return np.asarray(vecs, dtype=np.float32)

# ------------- DB Helpers -----------------
def get_articles_from_db(cursor) -> List[Article]:
    since = datetime.now(timezone.utc) - timedelta(hours=TIME_WINDOW_HOURS)
    cursor.execute(
        "SELECT * FROM tn_home_article WHERE published_at >= %s",
        (since,)
    )
    rows = cursor.fetchall()
    articles = []
    for row in rows:
        articles.append(Article(
            source=row.get('source'),
            source_domain=row.get('source_domain'),
            side=row.get('side'),
            title=row.get('title'),
            url=row.get('url'),
            published_at=row.get('published_at'),
            rss_desc=row.get('description'), # Map 'description' to 'rss_desc'
            thumbnail_url=row.get('thumbnail_url')
        ))
    logging.info(f"Fetched {len(articles)} recent articles from tn_home_article table.")
    return articles

def get_published_topics(cursor, target_topic_id: Optional[int] = None) -> List[Dict]:
    if target_topic_id:
        cursor.execute("SELECT * FROM tn_topic WHERE id=%s AND status='published' LIMIT 1", (target_topic_id,))
    else:
        cursor.execute("SELECT * FROM tn_topic WHERE status='published'")
    return cursor.fetchall()

def get_existing_urls_for_topic(cursor, topic_id: int) -> set:
    cursor.execute("SELECT url FROM tn_article WHERE topic_id=%s", (topic_id,))
    return {row['url'] for row in cursor.fetchall()}

def insert_article(cursor, topic_id: int, a: Article):
    cursor.execute(
        """
        INSERT IGNORE INTO tn_article
        (topic_id, source, source_domain, side, title, url, published_at, similarity, status, rss_desc, thumbnail_url, is_featured)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'suggested',%s,%s,0)
        """,
        (
            topic_id, a.source, a.source_domain, a.side, a.title, a.url,
            a.published_at, float(a.similarity), a.rss_desc, a.thumbnail_url
        )
    )

def update_collection_status(cursor, topic_id: int, status: str):
    cursor.execute("UPDATE tn_topic SET collection_status=%s, updated_at=NOW() WHERE id=%s", (status, topic_id))

# ------------- Main -----------------
def collect_for_topic(cnx, topic: Dict, articles: List[Article]):
    topic_id = int(topic["id"])
    display_name = topic.get("display_name") or topic.get("core_keyword")
    logging.info(f"▶ Analyzing articles for topic #{topic_id} '{display_name}'")

    raw_kw = (topic.get("search_keywords") or topic.get("core_keyword") or "").strip()
    if not raw_kw:
        logging.warning("  ↳ No search_keywords; skip")
        return

    initial_keywords = [s.strip() for s in raw_kw.split(",") if s.strip()]

    # Embeddings
    passage_texts = [f"{a.title} {a.rss_desc or ''}" for a in articles]
    passage_vecs = embed_texts(passage_texts, is_query=False)
    query_vecs = embed_texts(initial_keywords, is_query=True)

    sims = (passage_vecs @ query_vecs.T)
    max_sim = sims.max(axis=1)

    candidates: List[Article] = []
    for i, a in enumerate(articles):
        a.similarity = float(max_sim[i])
        if a.similarity >= SIMILARITY_THRESHOLD:
            candidates.append(a)
    
    logging.info(f"  ↳ Found {len(candidates)} candidates with similarity >= {SIMILARITY_THRESHOLD}")

    if not candidates:
      return

    # Filter out existing articles
    cursor = cnx.cursor(dictionary=True)
    update_collection_status(cursor, topic_id, "collecting")
    existing_urls = get_existing_urls_for_topic(cursor, topic_id)
    candidates = [a for a in candidates if a.url not in existing_urls]
    logging.info(f"  ↳ {len(candidates)} candidates remain after filtering existing URLs.")

    if not candidates:
      update_collection_status(cursor, topic_id, "completed")
      return

    # Rank by similarity and pick the top 10 for each side
    candidates.sort(key=lambda x: x.similarity, reverse=True)
    
    left_to_add, right_to_add = [], []
    for a in candidates:
        if a.side == "LEFT" and len(left_to_add) < 10:
            left_to_add.append(a)
        elif a.side == "RIGHT" and len(right_to_add) < 10:
            right_to_add.append(a)
        # Stop if both sides are full
        if len(left_to_add) >= 10 and len(right_to_add) >= 10:
            break

    # Insert the selected articles
    articles_to_add = left_to_add + right_to_add
    for article_to_add in articles_to_add:
        insert_article(cursor, topic_id, article_to_add)

    update_collection_status(cursor, topic_id, "completed")
    logging.info(f"✓ Topic #{topic_id} done: Inserted {len(articles_to_add)} new suggested articles ({len(left_to_add)} LEFT, {len(right_to_add)} RIGHT).")

def main():
    logging.info("--- Article Analyzer ---")
    target_topic_id = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else None

    cnx = None
    try:
        cnx = mysql.connector.connect(**DB_CONFIG)
        cursor = cnx.cursor(dictionary=True)
        logging.info("DB connected.")

        topics = get_published_topics(cursor, target_topic_id)
        if not topics:
            logging.warning("No published topics to analyze.")
            return
        
        # Fetch candidate articles from DB ONCE
        candidate_articles = get_articles_from_db(cursor)
        if not candidate_articles:
            logging.warning("No recent articles in tn_home_article to analyze.")
            return

        for t in topics:
            try:
                collect_for_topic(cnx, t, candidate_articles)
            except Exception as e:
                logging.exception(f"Topic #{t.get('id')} failed: {e}")
                try:
                    update_collection_status(cursor, int(t.get('id')), "failed")
                except Exception:
                    pass

    finally:
        if cnx:
            cnx.close()
        logging.info("All done.")

if __name__ == "__main__":
    main()