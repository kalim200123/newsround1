-- News Community Platform Migration Script
-- Date: 2025-11-24
-- Description: This script refactors the database schema to move from article-centric engagement (likes, comments)
-- to topic-centric engagement (votes, comments).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Step 1: Drop old tables related to article likes and views.
-- These features are being removed as per the new requirements.
DROP TABLE IF EXISTS `tn_article_like`;
DROP TABLE IF EXISTS `tn_article_view_log`;

-- Step 2: Drop old article comment tables.
-- These will be replaced by topic-specific comment tables.
DROP TABLE IF EXISTS `tn_article_comment_report_log`;
DROP TABLE IF EXISTS `tn_article_comment_reaction`;
DROP TABLE IF EXISTS `tn_article_comment`;

-- Step 3: Create the new topic comment table.
-- This table replaces tn_article_comment.
CREATE TABLE `tn_topic_comment` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `topic_id` int(11) NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `parent_comment_id` bigint(20) unsigned DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('ACTIVE','HIDDEN','DELETED_BY_USER','DELETED_BY_ADMIN') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `like_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '좋아요 수',
  `dislike_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '싫어요 수',
  `report_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '신고 수',
  `user_vote_side` enum('LEFT','RIGHT') DEFAULT NULL COMMENT '댓글 작성 시 사용자의 투표 입장',
  PRIMARY KEY (`id`),
  KEY `idx_topic_id` (`topic_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_comment_id` (`parent_comment_id`),
  CONSTRAINT `fk_topic_comment_topic` FOREIGN KEY (`topic_id`) REFERENCES `tn_topic` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_topic_comment_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_topic_comment_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `tn_topic_comment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='토픽별 댓글 및 대댓글';

-- Step 4: Create the new topic comment reaction table.
-- This table replaces tn_article_comment_reaction.
CREATE TABLE `tn_topic_comment_reaction` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL COMMENT '반응한 사용자의 ID',
  `comment_id` bigint(20) unsigned NOT NULL COMMENT '반응 대상 댓글의 ID',
  `reaction_type` enum('LIKE','DISLIKE') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '반응 종류',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_comment_reaction` (`user_id`,`comment_id`),
  KEY `fk_reaction_to_comment` (`comment_id`),
  CONSTRAINT `fk_topic_reaction_to_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_topic_reaction_to_comment` FOREIGN KEY (`comment_id`) REFERENCES `tn_topic_comment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='사용자의 토픽 댓글 반응(좋아요/싫어요) 기록';

-- Step 5: Create the new topic comment report log table.
-- This table replaces tn_article_comment_report_log.
CREATE TABLE `tn_topic_comment_report_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL COMMENT '신고한 사용자의 ID',
  `comment_id` bigint(20) unsigned NOT NULL COMMENT '신고 대상 댓글의 ID',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '신고 사유 (선택 사항)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_comment_report` (`user_id`,`comment_id`),
  KEY `fk_report_log_to_comment` (`comment_id`),
  CONSTRAINT `fk_topic_report_log_to_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_topic_report_log_to_comment` FOREIGN KEY (`comment_id`) REFERENCES `tn_topic_comment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='사용자의 토픽 댓글 신고 기록';

-- Step 6: Clean up chat tables.
-- Deletes chat messages and reports not related to the global chat (topic_id = 1).
-- NOTE: This is a destructive action.
DELETE FROM tn_chat_report_log WHERE chat_id IN (SELECT id FROM tn_chat WHERE topic_id != 1);
DELETE FROM tn_chat WHERE topic_id != 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Migration script finished. Please review carefully before execution.
