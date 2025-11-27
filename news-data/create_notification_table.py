import os
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

def create_table():
    try:
        print("Connecting to database...")
        cnx = mysql.connector.connect(**DB_CONFIG)
        cursor = cnx.cursor()
        
        print("Creating tn_notification table...")
        create_query = """
        CREATE TABLE IF NOT EXISTS `tn_notification` (
          `id` BIGINT NOT NULL AUTO_INCREMENT,
          `user_id` BIGINT NOT NULL COMMENT '알림을 받을 사용자의 ID',
          `type` ENUM('NEW_TOPIC', 'FRIEND_REQUEST', 'VOTE_REMINDER', 'ADMIN_NOTICE') NOT NULL,
          `message` VARCHAR(255) NOT NULL COMMENT '알림 메시지 본문',
          `related_url` VARCHAR(2048) DEFAULT NULL COMMENT '알림 클릭 시 이동할 URL',
          `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '읽음 여부 (0: 안읽음, 1: 읽음)',
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_user_id_created_at` (`user_id`, `created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        
        cursor.execute(create_query)
        print("Table tn_notification created successfully (or already exists).")
        
        cursor.close()
        cnx.close()
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")

if __name__ == "__main__":
    create_table()
