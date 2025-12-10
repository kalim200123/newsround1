
import requests
import pymysql
import os
from dotenv import load_dotenv
import time

def verify():
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
    
    db_config = {
        "host": os.getenv("DB_HOST"),
        "port": int(os.getenv("DB_PORT", 3306)),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "database": os.getenv("DB_DATABASE"),
    }
    if 'tidbcloud.com' in db_config.get('host', '') or os.getenv("DB_SSL_ENABLED") == 'true':
        db_config["ssl"] = {"rejectUnauthorized": False}

    conn = pymysql.connect(**db_config)
    cursor = conn.cursor()
    
    # 1. Get initial count
    cursor.execute("SELECT COUNT(*) FROM tn_visitor_log")
    initial_count = cursor.fetchone()[0]
    print(f"Initial Visitor Count: {initial_count}")
    
    # 2. Make a request
    try:
        # Try port 3001 (default in main.ts)
        url = "http://localhost:3001/api/health" # Assuming there's a health check or just /
        print(f"Sending request to {url}...")
        resp = requests.get(url, timeout=5)
        print(f"Response status: {resp.status_code}")
    except Exception as e:
        print(f"Request failed: {e}")
        # Try port 3000 just in case
        try:
            url = "http://localhost:3000/" 
            print(f"Retrying with {url}...")
            resp = requests.get(url, timeout=5)
            print(f"Response status: {resp.status_code}")
        except:
            pass

    # 3. Get new count
    time.sleep(1) # Wait for async logging
    cursor.execute("SELECT COUNT(*) FROM tn_visitor_log")
    final_count = cursor.fetchone()[0]
    print(f"Final Visitor Count: {final_count}")
    
    if final_count > initial_count:
        print("SUCCESS: Visitor count increased.")
    else:
        print("FAILURE: Visitor count did not increase.")
        
    conn.close()

if __name__ == "__main__":
    verify()
