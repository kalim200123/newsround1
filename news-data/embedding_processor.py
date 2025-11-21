import os
import sys
import json
import pymysql
import numpy as np
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from typing import List, Dict, Any

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Configuration
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 4000))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "test")
MODEL_NAME = os.getenv("EMBED_MODEL", "intfloat/multilingual-e5-base")

def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        ssl={'ssl': {'rejectUnauthorized': False}} # TiDB Cloud requires SSL
    )

def get_embedding(model, text: str) -> List[float]:
    # E5 models require 'query: ' or 'passage: ' prefix
    # We use 'passage: ' for articles and 'query: ' for search keywords
    # But for simplicity and consistency in this script, we'll handle prefixes in the caller
    return model.encode(text, normalize_embeddings=True).tolist()

def update_article_embeddings(conn, model):
    """
    Fetches articles from tn_home_article with NULL embeddings and updates them.
    """
    print("Checking for articles with missing embeddings...")
    with conn.cursor() as cursor:
        # Fetch up to 100 articles at a time to avoid memory issues
        cursor.execute("SELECT id, title, description FROM tn_home_article WHERE embedding IS NULL ORDER BY id DESC LIMIT 100")
        articles = cursor.fetchall()
        
        if not articles:
            print("No articles found with missing embeddings.")
            return

        print(f"Found {len(articles)} articles to embed.")
        
        for article in articles:
            text_to_embed = f"passage: {article['title']} {article['description'] or ''}"
            embedding = get_embedding(model, text_to_embed)
            embedding_json = json.dumps(embedding)
            
            # Update the article with the embedding
            # Note: TiDB Vector support usually requires a specific format or function, 
            # but here we assume we are storing it as a JSON string or Vector type if supported by the driver.
            # If TiDB Vector is enabled, we might need `VEC_FROM_TEXT` or similar.
            # For now, we'll try passing the JSON string which is common for vector columns in some setups,
            # or we might need to adjust based on the specific TiDB Vector API.
            # Let's assume standard string/json insert for now.
            cursor.execute("UPDATE tn_home_article SET embedding = %s WHERE id = %s", (embedding_json, article['id']))
            
        conn.commit()
        print(f"Updated {len(articles)} articles.")

def collect_articles_for_topic(conn, model, topic_id: int):
    print(f"Collecting articles for topic ID: {topic_id}")
    
    with conn.cursor() as cursor:
        # 1. Get Topic Keywords
        cursor.execute("SELECT display_name, embedding_keywords FROM tn_topic WHERE id = %s", (topic_id,))
        topic = cursor.fetchone()
        
        if not topic:
            print(f"Topic {topic_id} not found.")
            return

        keywords = f"{topic['display_name']} {topic['embedding_keywords']}"
        print(f"Topic Keywords: {keywords}")
        
        # 2. Generate Embedding for Topic
        query_text = f"query: {keywords}"
        query_embedding = get_embedding(model, query_text)
        query_embedding_json = json.dumps(query_embedding)
        
        # 3. Search for Similar Articles
        # We want to find articles from LEFT, RIGHT, and CENTER sides.
        # Let's try to find top 10 for each side to have enough candidates.
        
        sides = ['LEFT', 'RIGHT', 'CENTER']
        inserted_count = 0
        
        for side in sides:
            print(f"Searching for {side} articles...")
            
            # TiDB Vector search query
            # We use cosine distance. The closer to 0, the more similar.
            search_sql = """
            SELECT id, source, source_domain, title, url, published_at, thumbnail_url,
                   VEC_COSINE_DISTANCE(embedding, %s) as distance
            FROM tn_home_article
            WHERE side = %s 
              AND embedding IS NOT NULL
              AND published_at IS NOT NULL
            ORDER BY distance ASC
            LIMIT 10
            """
            
            cursor.execute(search_sql, (query_embedding_json, side))
            results = cursor.fetchall()
            
            print(f"Found {len(results)} candidates for {side}.")
            
            for row in results:
                # Check if already exists for this topic
                cursor.execute("SELECT id FROM tn_article WHERE topic_id = %s AND url = %s", (topic_id, row['url']))
                if cursor.fetchone():
                    continue
                
                # Insert into tn_article
                insert_sql = """
                INSERT INTO tn_article (topic_id, source, source_domain, side, title, url, published_at, thumbnail_url, status, similarity)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'suggested', %s)
                """
                # distance is 0 for identical, 1 for opposite. Similarity = 1 - distance (roughly)
                similarity = 1 - row['distance']
                
                cursor.execute(insert_sql, (
                    topic_id, row['source'], row['source_domain'], side, row['title'], 
                    row['url'], row['published_at'], row['thumbnail_url'], similarity
                ))
                inserted_count += 1
        
        conn.commit()
        print(f"Successfully added {inserted_count} new suggested articles.")
