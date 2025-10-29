import os
import mysql.connector
from dotenv import load_dotenv
from datetime import datetime, timezone

def calculate_and_update_popularity():
    """
    최근 3일간의 활동과 시간 감쇠(Gravity) 모델을 기반으로 토픽의 인기 점수를 계산하고 DB를 업데이트합니다.
    - 최종 점수 = Raw Score / (Age in hours + 2)^1.5
    - Raw Score = (토픽 조회수*1) + (기사 조회수*1) + (기사 좋아요*3) + (기사 저장*4)
    """
    
    dotenv_path = os.path.join(os.path.dirname(__file__), '../news-server', '.env')
    load_dotenv(dotenv_path=dotenv_path)

    DB_CONFIG = {
        "host": os.getenv("DB_HOST"),
        "port": int(os.getenv("DB_PORT", 3306)),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "database": os.getenv("DB_DATABASE"),
    }

    if os.getenv("DB_SSL_ENABLED") == 'true':
        is_production = os.getenv('NODE_ENV') == 'production'
        if is_production:
            DB_CONFIG["ssl_ca"] = "/etc/ssl/certs/ca-certificates.crt"
            DB_CONFIG["ssl_verify_cert"] = True
        else:
            DB_CONFIG["ssl_verify_cert"] = False
            
    print("--- Popularity Score Calculation Start ---")
    
    try:
        cnx = mysql.connector.connect(**DB_CONFIG)
        cursor = cnx.cursor(dictionary=True)
        print("DB Connected.")

        query = """
            SELECT
                t.id,
                t.published_at,
                MAX(t.view_count) AS topic_views,
                COALESCE(SUM(a.view_count), 0) AS total_article_views,
                MAX(COALESCE(l.like_count, 0)) AS total_likes,
                MAX(COALESCE(s.saved_count, 0)) AS total_saved_articles
            FROM
                tn_topic t
            LEFT JOIN
                tn_article a ON t.id = a.topic_id AND a.status = 'published' AND a.published_at >= NOW() - INTERVAL 3 DAY
            LEFT JOIN
                (SELECT a.topic_id, COUNT(l.id) as like_count FROM tn_article_like l JOIN tn_article a ON l.article_id = a.id WHERE l.created_at >= NOW() - INTERVAL 3 DAY GROUP BY a.topic_id) l ON t.id = l.topic_id
            LEFT JOIN
                (SELECT a.topic_id, COUNT(s.id) as saved_count FROM tn_user_saved_articles s JOIN tn_article a ON s.article_id = a.id WHERE s.created_at >= NOW() - INTERVAL 3 DAY GROUP BY a.topic_id) s ON t.id = s.topic_id
            WHERE
                t.status = 'published' AND t.topic_type = 'CONTENT'
            GROUP BY
                t.id, t.published_at;
        """
        
        cursor.execute(query)
        topics_to_update = cursor.fetchall()
        print(f"Found {len(topics_to_update)} topics to update.")

        update_queries = []
        GRAVITY = 1.5
        now_utc = datetime.now(timezone.utc)

        for topic in topics_to_update:
            raw_score = (int(topic['topic_views']) * 1) + \
                        (int(topic['total_article_views']) * 1) + \
                        (int(topic['total_likes']) * 3) + \
                        (int(topic['total_saved_articles']) * 4)

            if raw_score == 0:
                final_score = 0
            else:
                published_at = topic['published_at']
                if published_at.tzinfo is None:
                    published_at = published_at.replace(tzinfo=timezone.utc)
                
                age_in_hours = (now_utc - published_at).total_seconds() / 3600
                
                # Hacker News Gravity Formula
                final_score = raw_score / ((age_in_hours + 2) ** GRAVITY)

            update_queries.append((final_score, topic['id']))

        if update_queries:
            cursor.execute("UPDATE tn_topic SET popularity_score = 0 WHERE topic_type = 'CONTENT'")
            print(f"Reset scores for content topics.")

            update_query = "UPDATE tn_topic SET popularity_score = %s WHERE id = %s"
            cursor.executemany(update_query, update_queries)
            cnx.commit()
            print(f"Successfully updated scores for {cursor.rowcount} topics.")

    except mysql.connector.Error as err:
        print(f"Database Error: {err}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if 'cnx' in locals() and cnx.is_connected():
            cursor.close()
            cnx.close()
            print("DB Connection Closed.")
            
    print("--- Popularity Score Calculation End ---")


if __name__ == '__main__':
    calculate_and_update_popularity()
