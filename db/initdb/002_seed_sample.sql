-- 기본 사용자 계정
INSERT INTO tn_user (email, password, name, nickname, phone, status)
VALUES
  ('admin@different.news', '$2b$10$7OjLRog50LadpQ1a7AD7zOQLu/Z3zCnmeb31zqixWpsfhNznPrwiK', '관리자', 'admin', '01000000000', 'ACTIVE'),
  ('reporter1@different.news', '$2b$10$PSHYWqin2/ZNXqAjvSWwt.u1FIqPuZ0tt/8fClGqf/ZjIV2lpGyNK', '김기자', 'reporter1', NULL, 'ACTIVE');

-- 대표 토픽
INSERT INTO tn_topic (
  core_keyword,
  display_name,
  search_keywords,
  sub_description,
  summary,
  status,
  collection_status,
  created_at,
  published_at
)
VALUES (
  '전기차 보조금',
  '전기차 보조금 조정',
  '전기차, 보조금, 정책',
  '정부 지원 정책',
  '정부의 전기차 보조금 조정 논의를 정리합니다.',
  'published',
  'completed',
  NOW(),
  NOW()
);

SET @topic_id := (SELECT id FROM tn_topic WHERE core_keyword = '전기차 보조금');

-- 토픽 관련 기사
INSERT INTO tn_article (
  topic_id,
  source,
  source_domain,
  side,
  title,
  url,
  published_at,
  rss_desc,
  similarity,
  status,
  thumbnail_url,
  is_featured,
  display_order
)
VALUES
  (@topic_id, '경향신문', 'khan.co.kr', 'LEFT', '정부, 전기차 보조금 2026년까지 유지 검토', 'https://www.khan.co.kr/economy/article1', NOW(), NULL, 0.85, 'published', NULL, 1, 1),
  (@topic_id, '조선일보', 'chosun.com', 'RIGHT', '전기차 보조금 일몰 이후 산업 영향은', 'https://www.chosun.com/economy/article2', NOW(), NULL, 0.82, 'published', NULL, 0, 2);

-- 토픽 댓글
SET @user_admin := (SELECT id FROM tn_user WHERE email = 'admin@different.news');
SET @user_reporter := (SELECT id FROM tn_user WHERE email = 'reporter1@different.news');

INSERT INTO tn_comment (topic_id, user_id, content, status, created_at, updated_at)
VALUES
  (@topic_id, @user_admin, '전기차 정책 변화에 주목해 주세요.', 'ACTIVE', NOW(), NOW()),
  (@topic_id, @user_reporter, '관련 산업계 반응도 추가 취재 예정입니다.', 'ACTIVE', NOW(), NOW());

-- 데이터 확인용 선택
SET @topic_id = NULL;
SET @user_admin = NULL;
SET @user_reporter = NULL;
