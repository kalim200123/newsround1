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
            # 1. tn_topic: Rename search_keywords -> embedding_keywords
            print("Renaming search_keywords to embedding_keywords...")
            try:
                cursor.execute("ALTER TABLE tn_topic CHANGE COLUMN search_keywords embedding_keywords TEXT")
            except Exception as e:
                print(f"Warning (rename): {e}")

            # 2. tn_topic: Add new columns
            print("Adding new columns to tn_topic...")
            new_cols = [
                "ADD COLUMN stance_left VARCHAR(255) NULL COMMENT '좌측 주장'",
                "ADD COLUMN stance_right VARCHAR(255) NULL COMMENT '우측 주장'",
                "ADD COLUMN vote_start_at TIMESTAMP NULL COMMENT '투표 시작 일시'",
                "ADD COLUMN vote_end_at TIMESTAMP NULL COMMENT '투표 종료 일시'",
                "ADD COLUMN vote_count_left INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '좌측 투표 수'",
                "ADD COLUMN vote_count_right INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '우측 투표 수'"
            ]
            for col_sql in new_cols:
                try:
                    cursor.execute(f"ALTER TABLE tn_topic {col_sql}")
                except Exception as e:
                    print(f"Warning (add col): {e}")

            # 3. tn_topic: Drop popularity_score
            print("Dropping popularity_score...")
            try:
                cursor.execute("ALTER TABLE tn_topic DROP COLUMN popularity_score")
            except Exception as e:
                print(f"Warning (drop col): {e}")

            # 4. tn_topic: Update status ENUM
            print("Updating status ENUM...")
            # Step 4-1: Expand ENUM to include new values
            cursor.execute("ALTER TABLE tn_topic MODIFY COLUMN status ENUM('published','suggested','rejected','archived','PREPARING','OPEN','CLOSED')")
            
            # Step 4-2: Migrate data
            print("Migrating status data...")
            cursor.execute("UPDATE tn_topic SET status = 'OPEN' WHERE status = 'published'")
            cursor.execute("UPDATE tn_topic SET status = 'PREPARING' WHERE status = 'suggested'")
            cursor.execute("UPDATE tn_topic SET status = 'CLOSED' WHERE status IN ('rejected', 'archived')")
            
            # Step 4-3: Restrict ENUM to new values only
            cursor.execute("ALTER TABLE tn_topic MODIFY COLUMN status ENUM('PREPARING','OPEN','CLOSED') NOT NULL DEFAULT 'PREPARING'")

            # 5. Create tn_topic_vote table
            print("Creating tn_topic_vote table...")
            create_vote_table_sql = """
            CREATE TABLE IF NOT EXISTS tn_topic_vote (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                topic_id INT NOT NULL,
                user_id BIGINT UNSIGNED NOT NULL,
                side ENUM('LEFT', 'RIGHT') NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_topic_user (topic_id, user_id),
                CONSTRAINT fk_vote_topic FOREIGN KEY (topic_id) REFERENCES tn_topic (id) ON DELETE CASCADE,
                CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES tn_user (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 투표 기록';
            """
            cursor.execute(create_vote_table_sql)

            print("Schema migration completed successfully.")
        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
