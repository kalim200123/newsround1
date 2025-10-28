#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
home_article_pruner.py
- Deletes old articles from the tn_home_article table to prevent data bloat.
- Connects to the database and deletes records older than a specified retention period.
"""

import os
import sys
from dotenv import load_dotenv
import mysql.connector
from datetime import datetime

# .env 파일 로드
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

# --- Config ---
RETENTION_DAYS = int(os.getenv("HOME_ARTICLE_RETENTION_DAYS", "30"))

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_DATABASE"),
}

# SSL 설정 동적으로 추가
if os.getenv("DB_SSL_ENABLED") == 'true':
    is_production = os.getenv('NODE_ENV') == 'production'
    if is_production:
        DB_CONFIG["ssl_ca"] = "/etc/ssl/certs/ca-certificates.crt"
        DB_CONFIG["ssl_verify_cert"] = True
    else:
        DB_CONFIG["ssl_verify_cert"] = False

def main():
    """Main function to connect to the DB and prune old articles."""
    print(f"[{datetime.now()}] Starting home article pruning job...")
    print(f"Retention period: {RETENTION_DAYS} days")

    cnx = None
    try:
        cnx = mysql.connector.connect(**DB_CONFIG)
        cursor = cnx.cursor()

        query = f"""
            DELETE FROM tn_home_article 
            WHERE published_at < NOW() - INTERVAL {RETENTION_DAYS} DAY
        """
        
        print("Executing DELETE query...")
        cursor.execute(query)
        cnx.commit()
        
        deleted_rows = cursor.rowcount
        print(f"Successfully deleted {deleted_rows} old articles from tn_home_article.")

    except mysql.connector.Error as err:
        print(f"Error while pruning home articles: {err}", file=sys.stderr)
        sys.exit(1)
    finally:
        if cnx and cnx.is_connected():
            cursor.close()
            cnx.close()
        print(f"[{datetime.now()}] Pruning job finished.")

if __name__ == "__main__":
    main()
