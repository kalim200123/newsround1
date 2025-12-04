/*
 Navicat Premium Data Transfer

 Source Server         : test
 Source Server Type    : MySQL
 Source Server Version : 80011 (8.0.11-TiDB-v7.5.2-serverless)
 Source Host           : gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000
 Source Schema         : test

 Target Server Type    : MySQL
 Target Server Version : 80011 (8.0.11-TiDB-v7.5.2-serverless)
 File Encoding         : 65001

 Date: 02/12/2025 16:35:07
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for tn_article
-- ----------------------------
DROP TABLE IF EXISTS `tn_article`;
CREATE TABLE `tn_article`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `topic_id` int(11) NOT NULL,
  `source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_domain` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '언론사 도메인',
  `side` enum('LEFT','RIGHT','CENTER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `published_at` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `rss_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT 'RSS 피드에서 수집한 기사 요약',
  `similarity` float NULL DEFAULT NULL,
  `status` enum('suggested','published','rejected','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'suggested',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 수정 일시',
  `thumbnail_url` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '기사 썸네일 이미지 URL',
  `is_featured` tinyint(1) NOT NULL DEFAULT 0 COMMENT '대표 기사 여부',
  `display_order` int(11) NULL DEFAULT 0,
  `view_count` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '기사 조회수',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_topic_article`(`topic_id` ASC, `url`(255) ASC) USING BTREE,
  CONSTRAINT `tn_article_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `tn_topic` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 930611 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_chat
-- ----------------------------
DROP TABLE IF EXISTS `tn_chat`;
CREATE TABLE `tn_chat`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `topic_id` int(11) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('ACTIVE','HIDDEN','DELETED_BY_USER','DELETED_BY_ADMIN') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'ACTIVE',
  `report_count` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '누적 신고 횟수',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_chat_topic_created`(`topic_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `ix_chat_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_chat_topic` FOREIGN KEY (`topic_id`) REFERENCES `tn_topic` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_chat_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3886710 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '토픽별 실시간 채팅 메시지' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_chat_report_log
-- ----------------------------
DROP TABLE IF EXISTS `tn_chat_report_log`;
CREATE TABLE `tn_chat_report_log`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `chat_id` bigint(20) UNSIGNED NOT NULL COMMENT '신고된 채팅 메시지 ID',
  `user_id` bigint(20) UNSIGNED NOT NULL COMMENT '신고한 사용자 ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '신고 사유',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `ux_chat_user_report`(`chat_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `fk_report_log_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_report_log_chat` FOREIGN KEY (`chat_id`) REFERENCES `tn_chat` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_report_log_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 450001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '채팅 메시지 신고 기록' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_home_article
-- ----------------------------
DROP TABLE IF EXISTS `tn_home_article`;
CREATE TABLE `tn_home_article`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `source_domain` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `side` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `url` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `published_at` datetime NULL DEFAULT NULL,
  `view_count` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `thumbnail_url` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `embedding` vector NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `url`(`url`(255) ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17640001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '홈 화면 노출용 기사' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_inquiry
-- ----------------------------
DROP TABLE IF EXISTS `tn_inquiry`;
CREATE TABLE `tn_inquiry`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL COMMENT '문의를 남긴 사용자 ID',
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '문의 주제',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '문의 내용',
  `file_path` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '첨부 파일 경로',
  `privacy_agreement` tinyint(1) NOT NULL COMMENT '개인정보 수집 및 동의 여부',
  `status` enum('SUBMITTED','IN_PROGRESS','RESOLVED') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'SUBMITTED' COMMENT '처리 상태',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  `file_originalname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_inquiry_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_inquiry_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 270001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '사용자 문의' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_inquiry_reply
-- ----------------------------
DROP TABLE IF EXISTS `tn_inquiry_reply`;
CREATE TABLE `tn_inquiry_reply`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `inquiry_id` bigint(20) UNSIGNED NOT NULL COMMENT '원본 문의 ID',
  `admin_username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '답변 관리자 사용자 이름',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '답변 내용',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_reply_inquiry`(`inquiry_id` ASC) USING BTREE,
  CONSTRAINT `fk_reply_inquiry` FOREIGN KEY (`inquiry_id`) REFERENCES `tn_inquiry` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 120001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '문의에 대한 관리자 답변' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_notification
-- ----------------------------
DROP TABLE IF EXISTS `tn_notification`;
CREATE TABLE `tn_notification`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT '알림을 받을 사용자의 ID',
  `type` enum('NEW_TOPIC','FRIEND_REQUEST','VOTE_REMINDER','ADMIN_NOTICE','BREAKING_NEWS','EXCLUSIVE_NEWS') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '알림 메시지 본문',
  `related_url` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '알림 클릭 시 이동할 URL',
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '읽음 여부 (0: 안읽음, 1: 읽음)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id_created_at`(`user_id` ASC, `created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 150001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_topic
-- ----------------------------
DROP TABLE IF EXISTS `tn_topic`;
CREATE TABLE `tn_topic`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `display_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '관리자가 수정한 최종 토픽 이름',
  `embedding_keywords` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '관리자가 작성하는 중립적 요약',
  `status` enum('PREPARING','OPEN','CLOSED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PREPARING',
  `collection_status` enum('pending','collecting','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '기사 수집 상태',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '후보 생성 일시',
  `published_at` timestamp NULL DEFAULT NULL COMMENT '발행 일시',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 수정 일시',
  `view_count` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '토픽 조회수',
  `stance_left` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '좌측 주장',
  `stance_right` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '우측 주장',
  `vote_start_at` timestamp NULL DEFAULT NULL COMMENT '투표 시작 일시',
  `vote_end_at` timestamp NULL DEFAULT NULL COMMENT '투표 종료 일시',
  `vote_count_left` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '좌측 투표 수',
  `vote_count_right` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '우측 투표 수',
  `topic_type` enum('VOTING','CATEGORY','KEYWORD') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `popularity_score` int(11) NULL DEFAULT 0 COMMENT '인기 점수 (투표수 + 댓글수*10 + 조회수)',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `status`(`status` ASC) USING BTREE,
  UNIQUE INDEX `unique_display_name`(`display_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 660074 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'AI가 추천하고 관리자가 검토하는 토픽 후보 테이블' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_topic_comment
-- ----------------------------
DROP TABLE IF EXISTS `tn_topic_comment`;
CREATE TABLE `tn_topic_comment`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `topic_id` int(11) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `parent_comment_id` bigint(20) UNSIGNED NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('ACTIVE','HIDDEN','DELETED_BY_USER','DELETED_BY_ADMIN') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `like_count` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '좋아요 수',
  `dislike_count` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '싫어요 수',
  `report_count` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '신고 수',
  `user_vote_side` enum('LEFT','RIGHT') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '댓글 작성 시 사용자의 투표 입장',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_topic_id`(`topic_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_parent_comment_id`(`parent_comment_id` ASC) USING BTREE,
  CONSTRAINT `fk_topic_comment_topic` FOREIGN KEY (`topic_id`) REFERENCES `tn_topic` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_topic_comment_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_topic_comment_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `tn_topic_comment` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 30001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '토픽별 댓글 및 대댓글' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_topic_comment_reaction
-- ----------------------------
DROP TABLE IF EXISTS `tn_topic_comment_reaction`;
CREATE TABLE `tn_topic_comment_reaction`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL COMMENT '반응한 사용자의 ID',
  `comment_id` bigint(20) UNSIGNED NOT NULL COMMENT '반응 대상 댓글의 ID',
  `reaction_type` enum('LIKE','DISLIKE') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '반응 종류',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_comment_reaction`(`user_id` ASC, `comment_id` ASC) USING BTREE,
  INDEX `fk_reaction_to_comment`(`comment_id` ASC) USING BTREE,
  CONSTRAINT `fk_topic_reaction_to_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_topic_reaction_to_comment` FOREIGN KEY (`comment_id`) REFERENCES `tn_topic_comment` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '사용자의 토픽 댓글 반응(좋아요/싫어요) 기록' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_topic_comment_report_log
-- ----------------------------
DROP TABLE IF EXISTS `tn_topic_comment_report_log`;
CREATE TABLE `tn_topic_comment_report_log`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL COMMENT '신고한 사용자의 ID',
  `comment_id` bigint(20) UNSIGNED NOT NULL COMMENT '신고 대상 댓글의 ID',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '신고 사유 (선택 사항)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_comment_report`(`user_id` ASC, `comment_id` ASC) USING BTREE,
  INDEX `fk_report_log_to_comment`(`comment_id` ASC) USING BTREE,
  CONSTRAINT `fk_topic_report_log_to_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_topic_report_log_to_comment` FOREIGN KEY (`comment_id`) REFERENCES `tn_topic_comment` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '사용자의 토픽 댓글 신고 기록' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_topic_view_log
-- ----------------------------
DROP TABLE IF EXISTS `tn_topic_view_log`;
CREATE TABLE `tn_topic_view_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `topic_id` int(11) NOT NULL,
  `user_identifier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_topic_user_time`(`topic_id` ASC, `user_identifier` ASC, `created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4350001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '토픽 조회수 중복 방지용 로그' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_topic_vote
-- ----------------------------
DROP TABLE IF EXISTS `tn_topic_vote`;
CREATE TABLE `tn_topic_vote`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `topic_id` int(11) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `side` enum('LEFT','RIGHT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_topic_user`(`topic_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `fk_vote_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_vote_topic` FOREIGN KEY (`topic_id`) REFERENCES `tn_topic` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_vote_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 60001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '사용자 투표 기록' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_trending_keyword
-- ----------------------------
DROP TABLE IF EXISTS `tn_trending_keyword`;
CREATE TABLE `tn_trending_keyword`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `keyword` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_keyword`(`keyword` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 66502 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_user
-- ----------------------------
DROP TABLE IF EXISTS `tn_user`;
CREATE TABLE `tn_user`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'hashed password',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` enum('ACTIVE','SUSPENDED','DELETED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `warning_count` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '/public/avatars/default.svg',
  `introduction` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '자기소개',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `ux_tn_user_email`(`email` ASC) USING BTREE,
  UNIQUE INDEX `ux_tn_user_nickname`(`nickname` ASC) USING BTREE,
  UNIQUE INDEX `ux_tn_user_phone`(`phone` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 536282 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '일반 사용자' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_user_notification_settings
-- ----------------------------
DROP TABLE IF EXISTS `tn_user_notification_settings`;
CREATE TABLE `tn_user_notification_settings`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `notification_type` enum('NEW_TOPIC','FRIEND_REQUEST','VOTE_REMINDER','ADMIN_NOTICE','BREAKING_NEWS','EXCLUSIVE_NEWS') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_notification_type`(`user_id` ASC, `notification_type` ASC) USING BTREE,
  CONSTRAINT `fk_notification_settings_user` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 180001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '사용자별 알림 수신 설정' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_user_saved_article_categories
-- ----------------------------
DROP TABLE IF EXISTS `tn_user_saved_article_categories`;
CREATE TABLE `tn_user_saved_article_categories`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_user_category`(`user_id` ASC, `name` ASC) USING BTREE,
  CONSTRAINT `fk_1` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 540001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '사용자가 생성한 저장된 기사 카테고리' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_user_saved_articles
-- ----------------------------
DROP TABLE IF EXISTS `tn_user_saved_articles`;
CREATE TABLE `tn_user_saved_articles`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `article_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` int(11) NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uq_user_article`(`user_id` ASC, `article_id` ASC) USING BTREE,
  INDEX `fk_2`(`category_id` ASC) USING BTREE,
  CONSTRAINT `fk_1` FOREIGN KEY (`user_id`) REFERENCES `tn_user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_2` FOREIGN KEY (`category_id`) REFERENCES `tn_user_saved_article_categories` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1020001 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin COMMENT = '사용자가 저장한 개별 기사' ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tn_visitor_log
-- ----------------------------
DROP TABLE IF EXISTS `tn_visitor_log`;
CREATE TABLE `tn_visitor_log`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_identifier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'IP address or User ID',
  `user_agent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_user_date`(`user_identifier` ASC, `created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10290497 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Compact;

SET FOREIGN_KEY_CHECKS = 1;
