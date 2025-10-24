import os
import mysql.connector
from dotenv import load_dotenv

def calculate_and_update_popularity():
    """
    최근 3일간의 활동을 기반으로 모든 'CONTENT' 타입 토픽의 인기 점수를 다시 계산하고 DB를 업데이트합니다.
    - 인기 점수 = (토픽 조회수*1) + (기사 조회수*1) + (기사 좋아요*2) + (기사 저장*3)
    """
    
    # .env 파일 로드
    # 이 스크립트는 news-server에서 실행되므로, news-server의 .env를 사용합니다.
    dotenv_path = os.path.join(os.path.dirname(__file__), '../news-server', '.env')
    load_dotenv(dotenv_path=dotenv_path)

    # DB 설정
    DB_CONFIG = {
        "host": os.getenv("DB_HOST"),
        "port": int(os.getenv("DB_PORT", 3306)),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "database": os.getenv("DB_DATABASE"),
    }

    # 환경에 따라 SSL 설정을 동적으로 추가
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

        # 1. 점수 계산에 필요한 모든 지표를 JOIN하여 한번에 가져오는 쿼리
        # 복잡성을 줄이기 위해, 각 토픽별로 기사 좋아요 수를 합산하는 서브쿼리를 사용합니다.
        query = """
            SELECT
                t.id,
                t.view_count AS topic_views,
                COALESCE(SUM(a.view_count), 0) AS total_article_views,
                COALESCE(l.like_count, 0) AS total_likes,
                COALESCE(s.saved_count, 0) AS total_saved_articles
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
                t.id, l.like_count, s.saved_count;
        """
        
        cursor.execute(query)
        topics_to_update = cursor.fetchall()
        print(f"Found {len(topics_to_update)} topics to update.")

        # 2. 각 토픽에 대해 점수 계산 및 업데이트
        update_queries = []
        for topic in topics_to_update:
            score = (int(topic['topic_views']) * 1) + \
                    (int(topic['total_article_views']) * 1) + \
                    (int(topic['total_likes']) * 2) + \
                    (int(topic['total_saved_articles']) * 3)
            
            update_queries.append((score, topic['id']))

        if update_queries:
            # 모든 토픽의 점수를 0으로 초기화 (3일이 지나 인기가 없어진 토픽 처리)
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
