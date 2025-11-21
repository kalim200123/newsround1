#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
vector_indexer.py
- Fetches articles from tn_home_article that haven't been vectorized yet.
- Generates vector embeddings for them using an AI model.
- Updates the 'embedding' column in the database.
- Includes a locking mechanism to prevent concurrent runs.
"""

import os
import sys
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import List, Dict

import numpy as np
from sentence_transformers import SentenceTransformer
import mysql.connector
from dotenv import load_dotenv

# --- Configuration & Setup ---
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

MODEL_NAME = os.getenv("EMBED_MODEL", "intfloat/multilingual-e5-base")
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_DATABASE"),
}
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
BATCH_SIZE = int(os.getenv("INDEXER_BATCH_SIZE", "64"))
LOCK_FILE_TIMEOUT = int(os.getenv("INDEXER_LOCK_TIMEOUT", "3600")) # 1 hour

if os.getenv("DB_SSL_ENABLED") == 'true':
    is_production = os.getenv('NODE_ENV') == 'production'
    if is_production:
        DB_CONFIG["ssl_ca"] = "/etc/ssl/certs/ca-certificates.crt"
        DB_CONFIG["ssl_verify_cert"] = True
    else:
        DB_CONFIG["ssl_verify_cert"] = False

LOG_FILE_PATH = os.path.join(os.path.dirname(__file__), 'indexer.log')
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE_PATH, mode='a', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# --- Locking Mechanism ---
LOCK_FILE_PATH = os.path.join(os.path.dirname(__file__), 'vector_indexer.lock')

def acquire_lock():
    if os.path.exists(LOCK_FILE_PATH):
        lock_time = os.path.getmtime(LOCK_FILE_PATH)
        if (time.time() - lock_time) > LOCK_FILE_TIMEOUT:
            logging.warning(f"Found stale lock file (older than {LOCK_FILE_TIMEOUT}s), removing it.")
            os.remove(LOCK_FILE_PATH)
        else:
            logging.info(f"Lock file exists (created at {datetime.fromtimestamp(lock_time)}), another process is likely running. Exiting.")
            return False
    try:
        with open(LOCK_FILE_PATH, 'w') as f:
            f.write(str(os.getpid()))
        logging.info(f"Acquired lock: {LOCK_FILE_PATH}")
        return True
    except IOError as e:
        logging.error(f"Failed to acquire lock: {e}")
        return False

def release_lock():
    try:
        if os.path.exists(LOCK_FILE_PATH):
            os.remove(LOCK_FILE_PATH)
            logging.info("Lock released.")
    except IOError as e:
        logging.error(f"Failed to release lock: {e}")

# --- Main Logic ---
def main():
    logging.info("--- Vector Indexer Starting ---")
    if not acquire_lock():
        return

    cnx = None
    try:
        cnx = mysql.connector.connect(**DB_CONFIG)
        cursor = cnx.cursor(dictionary=True)
        logging.info("DB connected.")

        cursor.execute("SELECT id, title, description FROM tn_home_article WHERE embedding IS NULL")
        articles_to_index = cursor.fetchall()

        if not articles_to_index:
            logging.info("No new articles to index.")
            return

        logging.info(f"Found {len(articles_to_index)} articles to index.")

        model = SentenceTransformer(MODEL_NAME)
        
        texts_to_embed = [f"passage: {a['title']} {a['description'] or ''}"[:1024] for a in articles_to_index]
        
        logging.info(f"Generating embeddings for {len(texts_to_embed)} texts...")
        embeddings = model.encode(texts_to_embed, batch_size=BATCH_SIZE, show_progress_bar=True, normalize_embeddings=True)
        
        logging.info("Embeddings generated. Updating database...")
        
        update_data = []
        for article, embedding in zip(articles_to_index, embeddings):
            # TiDB VECTOR type takes a JSON string representation of the list
            embedding_str = str(list(embedding.astype(float)))
            update_data.append((embedding_str, article['id']))
        # Log how many rows will be inserted (batch size)
        if len(update_data) % BATCH_SIZE == 0:
            logging.info(f"Prepared {len(update_data)} embeddings for insertion (batch size reached).")

        # Log total number of rows to insert before executing batch
        logging.info(f"Inserting total of {len(update_data)} embeddings into DB.")
        update_query = "UPDATE tn_home_article SET embedding = %s WHERE id = %s"
        cursor.executemany(update_query, update_data)
        cnx.commit()

        logging.info(f"Successfully indexed {cursor.rowcount} articles.")

    except Exception as e:
        logging.exception(f"An unexpected error occurred during indexing: {e}")
    finally:
        if cnx and cnx.is_connected():
            cursor.close()
            cnx.close()
        release_lock()
        logging.info("--- Vector Indexer Finished ---")

if __name__ == "__main__":
    main()
