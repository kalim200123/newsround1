CREATE TABLE `tn_user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'hashed password',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','SUSPENDED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `warning_count` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_tn_user_email` (`email`),
  UNIQUE KEY `ux_tn_user_nickname` (`nickname`),
  UNIQUE KEY `ux_tn_user_phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='일반 사용자';

CREATE TABLE `tn_topic` (
  `id` int NOT NULL AUTO_INCREMENT,
  `core_keyword` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '핵심 키워드',
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '관리자가 수정한 최종 토픽 이름',
  `search_keywords` text COLLATE utf8mb4_unicode_ci COMMENT '관리자가 수정한 기사 검색용 키워드 목록',
  `sub_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '보조 설명 키워드',
  `summary` text COLLATE utf8mb4_unicode_ci COMMENT '관리자가 작성하는 중립적 요약',
  `status` enum('published','suggested','rejected','archived') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection_status` enum('pending','collecting','completed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '기사 수집 상태',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '후보 생성 일시',
  `published_at` timestamp NULL DEFAULT NULL COMMENT '발행 일시',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 수정 일시',
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_keyword` (`core_keyword`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4_unicode_ci COMMENT='AI가 추천하고 관리자가 검토하는 토픽 후보 테이블';

CREATE TABLE `tn_article` (
  `id` int NOT NULL AUTO_INCREMENT,
  `topic_id` int NOT NULL,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_domain` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '언론사 도메인',
  `side` enum('LEFT','RIGHT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(2048) COLLATE utf8mb4_unicode_ci NOT NULL,
  `published_at` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rss_desc` text COLLATE utf8mb4_unicode_ci COMMENT 'RSS 피드에서 수집한 기사 요약',
  `similarity` float DEFAULT NULL,
  `status` enum('suggested','published','rejected','deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'suggested',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 수정 일시',
  `thumbnail_url` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '기사 썸네일 이미지 URL',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0' COMMENT '대표 기사 여부',
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_topic_article` (`topic_id`,`url`(255)),
  CONSTRAINT `tn_article_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `tn_topic` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=551 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tn_comment` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `topic_id` int NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','HIDDEN','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_tn_comment_topic_created` (`topic_id`,`created_at`),
  KEY `ix_tn_comment_user_id` (`user_id`),
  CONSTRAINT `fk_tn_comment_topic` FOREIGN KEY (`topic_id`) REFERENCES `tn_topic` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tn_comment_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='토픽별 댓글';
