# 데이터베이스 스키마 (Database Schema)

## 개요 (Overview)

- **Database**: TiDB (MySQL Compatible)
- **Charset**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci` / `utf8mb4_bin`

## 테이블 목록 (Tables)

### 1. 사용자 및 알림 (User & Notification)

#### `tn_user` (사용자)

사용자 계정 정보를 저장합니다.

- `id` (PK): BigInt, Auto Increment
- `email`: Varchar(254), Unique
- `password`: Varchar(255) (Hashed)
- `name`: Varchar(100)
- `nickname`: Varchar(50), Unique
- `phone`: Varchar(20), Unique
- `status`: Enum('ACTIVE', 'SUSPENDED', 'DELETED')
- `warning_count`: TinyInt (Default 0)
- `profile_image_url`: Varchar(255) (Default '/public/avatars/default.svg')
- `introduction`: Varchar(255) (자기소개)

#### `tn_user_notification_settings` (알림 설정)

사용자별 알림 수신 설정을 저장합니다.

- `id` (PK): Int, Auto Increment
- `user_id` (FK -> `tn_user.id`)
- `notification_type`: Enum('NEW_TOPIC', 'BREAKING_NEWS', 'EXCLUSIVE_NEWS')
- `is_enabled`: TinyInt(1) (Default 1)

### 2. 토픽 및 기사 (Topic & Article)

#### `tn_topic` (토픽)

토론 주제, 뉴스 그룹, 투표 토픽, 그리고 고정 채팅방을 관리합니다.

- `id` (PK): Int, Auto Increment
- `display_name`: Varchar(255) (Unique)
- `embedding_keywords`: Text (AI 기반 기사 수집을 위한 키워드)
- `sub_description`: Varchar(255) (부제목)
- `summary`: Text (요약)
- `status`: Enum('PREPARING', 'OPEN', 'CLOSED')
  - `PREPARING`: 준비 중 (관리자가 작성 중)
  - `OPEN`: 공개됨 (사용자에게 표시)
  - `CLOSED`: 종료됨 (투표 종료, 더 이상 활성화되지 않음)
- `collection_status`: Enum('pending', 'collecting', 'completed', 'failed')
- `topic_type`: Enum('CATEGORY', 'VOTING', 'DEBATE') (Default 'VOTING')
  - `CATEGORY`: 고정 채팅방 (메인, 정치, 경제, 사회, 문화, 스포츠)
  - `VOTING`: ROUND2 투표 토픽
  - `DEBATE`: ROUND3 1:1 토론 (미구현)
- `view_count`: Int (Default 0)
- `stance_left`: Text (좌측 입장)
- `stance_right`: Text (우측 입장)
- `vote_start_at`: DateTime (투표 시작 시간)
- `vote_end_at`: DateTime (투표 종료 시간)
- `vote_count_left`: Int (좌측 득표 수)
- `vote_count_right`: Int (우측 득표 수)
- `created_at`: Timestamp
- `published_at`: Timestamp
- `updated_at`: Timestamp

#### `tn_article` (기사)

토픽에 속한 뉴스 기사입니다.

- `id` (PK): Int, Auto Increment
- `topic_id` (FK -> `tn_topic.id`)
- `source`: Varchar(50)
- `source_domain`: Varchar(255)
- `side`: Enum('LEFT', 'CENTER', 'RIGHT')
- `title`: Varchar(255)
- `url`: Varchar(2048)
- `published_at`: Varchar(100)
- `rss_desc`: Text (RSS 설명)
- `similarity`: Float (AI 유사도 점수)
- `status`: Enum('suggested', 'published', 'rejected', 'deleted')
- `thumbnail_url`: Varchar(2048)
- `is_featured`: TinyInt(1)
- `display_order`: Int (표시 순서)
- `view_count`: Int (Default 0)
- `updated_at`: Timestamp

#### `tn_topic_vote` (토픽 투표)

사용자의 투표 기록입니다.

- `id` (PK): BigInt, Auto Increment
- `topic_id` (FK -> `tn_topic.id`)
- `user_id` (FK -> `tn_user.id`)
- `vote_side`: Enum('LEFT', 'RIGHT')
- `created_at`: Timestamp

#### `tn_home_article` (홈 화면 기사)

홈 화면에 노출되는 기사 목록입니다.

- `id` (PK): Int, Auto Increment
- `category`: Varchar(50)
- `embedding`: Vector (AI 임베딩)

### 3. 반응 및 활동 (Reactions & Activities)

#### `tn_article_like` (기사 좋아요)

기사에 대한 좋아요 기록입니다.

- `id` (PK): BigInt, Auto Increment
- `user_id`: BigInt
- `article_id`: Int
- `topic_id`: Int

#### `tn_article_view_log` (기사 조회 로그)

기사 조회수 중복 방지를 위한 로그입니다.

- `id` (PK): BigInt, Auto Increment
- `article_id`: BigInt
- `user_identifier`: Varchar(255)

#### `tn_topic_view_log` (토픽 조회 로그)

토픽 조회수 중복 방지를 위한 로그입니다.

- `id` (PK): Int, Auto Increment
- `topic_id`: Int
- `user_identifier`: Varchar(255)

#### `tn_user_saved_articles` (기사 스크랩)

사용자가 저장한 기사입니다.

- `id` (PK): Int, Auto Increment
- `user_id` (FK -> `tn_user.id`)
- `article_id`: BigInt
- `category_id`: Int (FK -> `tn_user_saved_article_categories.id`)

#### `tn_user_saved_article_categories` (스크랩 카테고리)

기사 저장 시 사용하는 카테고리입니다.

- `id` (PK): Int, Auto Increment
- `user_id` (FK -> `tn_user.id`)
- `name`: Varchar(100)

### 4. 댓글 (Comments)

#### `tn_article_comment` (기사 댓글)

기사에 달린 댓글 및 대댓글입니다.

- `id` (PK): BigInt, Auto Increment
- `article_id` (FK -> `tn_article.id`)
- `user_id` (FK -> `tn_user.id`)
- `parent_comment_id`: BigInt (Self FK)
- `content`: Text
- `status`: Enum('ACTIVE', 'HIDDEN', 'DELETED_BY_USER', 'DELETED_BY_ADMIN')
- `like_count`: Int
- `dislike_count`: Int
- `report_count`: Int

#### `tn_article_comment_reaction` (댓글 반응)

댓글에 대한 좋아요/싫어요입니다.

- `id` (PK): BigInt, Auto Increment
- `user_id` (FK -> `tn_user.id`)
- `comment_id` (FK -> `tn_article_comment.id`)
- `reaction_type`: Enum('LIKE', 'DISLIKE')

#### `tn_article_comment_report_log` (댓글 신고)

댓글 신고 로그입니다.

- `id` (PK): BigInt, Auto Increment
- `user_id` (FK -> `tn_user.id`)
- `comment_id` (FK -> `tn_article_comment.id`)
- `reason`: Varchar(255)

### 5. 채팅 (Chat)

#### `tn_chat` (실시간 채팅)

토픽별 실시간 채팅 메시지입니다.

- `id` (PK): BigInt, Auto Increment
- `topic_id` (FK -> `tn_topic.id`)
- `user_id` (FK -> `tn_user.id`)
- `content`: Text
- `status`: Enum('ACTIVE', 'HIDDEN', 'DELETED_BY_USER', 'DELETED_BY_ADMIN')
- `report_count`: Int

#### `tn_chat_report_log` (채팅 신고)

채팅 메시지 신고 로그입니다.

- `id` (PK): BigInt, Auto Increment
- `chat_id` (FK -> `tn_chat.id`)
- `user_id` (FK -> `tn_user.id`)
- `reason`: Varchar(255)

### 6. 고객 지원 (Inquiry)

#### `tn_inquiry` (1:1 문의)

사용자 문의 내역입니다.

- `id` (PK): BigInt, Auto Increment
- `user_id` (FK -> `tn_user.id`)
- `subject`: Varchar(255)
- `content`: Text
- `file_path`: Varchar(2048)
- `status`: Enum('SUBMITTED', 'IN_PROGRESS', 'RESOLVED')

#### `tn_inquiry_reply` (문의 답변)

관리자 답변입니다.

- `id` (PK): BigInt, Auto Increment
- `inquiry_id` (FK -> `tn_inquiry.id`)
- `admin_username`: Varchar(255)
- `content`: Text
