import os
import pymysql
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 4000))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "test")

def migrate():
    print(f"Connecting to {DB_HOST}:{DB_PORT} / {DB_NAME}...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        ssl={'ssl': {'rejectUnauthorized': False}}
    )
    
    try:
        with conn.cursor() as cursor:
            print("Altering tn_article table...")
            cursor.execute("ALTER TABLE tn_article MODIFY COLUMN side ENUM('LEFT', 'RIGHT', 'CENTER') NOT NULL")
            print("Schema updated successfully.")
        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
