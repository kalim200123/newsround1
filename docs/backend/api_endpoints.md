# API 엔드포인트 목록 (API Endpoints)

이 문서는 백엔드의 모든 API 엔드포인트를 정리한 것입니다.

## 인증 (Authentication)

**Base URL**: `/api/auth`

| Method | Endpoint    | 설명           | 인증 필요   |
| ------ | ----------- | -------------- | ----------- |
| POST   | `/login`    | 사용자 로그인  | ❌          |
| POST   | `/register` | 회원가입       | ❌          |
| GET    | `/profile`  | 내 프로필 조회 | ✅ User JWT |
| PATCH  | `/profile`  | 프로필 수정    | ✅ User JWT |

---

## 토픽 (Topics)

**Base URL**: `/api/topics`

| Method | Endpoint               | 설명                          | 인증 필요   |
| ------ | ---------------------- | ----------------------------- | ----------- |
| GET    | `/`                    | 토픽 목록 조회 (필터, 페이징) | ❌          |
| GET    | `/:id`                 | 토픽 상세 조회                | ❌          |
| GET    | `/:id/articles`        | 토픽의 기사 목록              | ❌          |
| GET    | `/popular-ranking`     | 인기 토픽 순위 (TOP 10)       | ❌          |
| GET    | `/popular-all`         | 모든 인기 토픽                | ❌          |
| POST   | `/:id/vote`            | 토픽 투표하기                 | ✅ User JWT |
| DELETE | `/:id/vote`            | 투표 취소                     | ✅ User JWT |
| GET    | `/:id/vote-statistics` | 투표 통계 조회                | ❌          |

---

## 토픽 댓글 (Topic Comments)

**Base URL**: `/api/topics/:topicId/comments`

| Method | Endpoint                | 설명               | 인증 필요   |
| ------ | ----------------------- | ------------------ | ----------- |
| GET    | `/`                     | 댓글 목록 조회     | ❌          |
| POST   | `/`                     | 댓글 작성          | ✅ User JWT |
| PATCH  | `/:commentId`           | 댓글 수정          | ✅ User JWT |
| DELETE | `/:commentId`           | 댓글 삭제          | ✅ User JWT |
| POST   | `/:commentId/reactions` | 댓글 좋아요/싫어요 | ✅ User JWT |
| DELETE | `/:commentId/reactions` | 반응 취소          | ✅ User JWT |
| POST   | `/:commentId/report`    | 댓글 신고          | ✅ User JWT |

---

## 실시간 채팅 (Chat)

**WebSocket**: `/socket.io`

### 이벤트 (Events)

| Event           | Direction       | 설명               | 데이터                                      |
| --------------- | --------------- | ------------------ | ------------------------------------------- |
| `joinRoom`      | Client → Server | 채팅방 입장        | `{ topicId: number }`                       |
| `leaveRoom`     | Client → Server | 채팅방 퇴장        | `{ topicId: number }`                       |
| `sendMessage`   | Client → Server | 메시지 전송        | `{ topicId, content }`                      |
| `newMessage`    | Server → Client | 새 메시지 수신     | `{ id, topicId, user, content, createdAt }` |
| `reportMessage` | Client → Server | 메시지 신고        | `{ chatId: number }`                        |
| `messageHidden` | Server → Client | 메시지 숨김 처리됨 | `{ chatId: number }`                        |

---

## 검색 (Search)

**Base URL**: `/api/search`

| Method | Endpoint    | 설명      | 인증 필요 |
| ------ | ----------- | --------- | --------- |
| GET    | `/topics`   | 토픽 검색 | ❌        |
| GET    | `/articles` | 기사 검색 | ❌        |

---

## 저장된 기사 (Saved Articles)

**Base URL**: `/api/saved`

| Method | Endpoint        | 설명             | 인증 필요   |
| ------ | --------------- | ---------------- | ----------- |
| GET    | `/categories`   | 내 카테고리 목록 | ✅ User JWT |
| POST   | `/categories`   | 카테고리 생성    | ✅ User JWT |
| GET    | `/articles`     | 저장한 기사 목록 | ✅ User JWT |
| POST   | `/articles`     | 기사 저장        | ✅ User JWT |
| DELETE | `/articles/:id` | 저장 취소        | ✅ User JWT |

---

## 알림 (Notifications)

**Base URL**: `/api/notifications`

| Method | Endpoint    | 설명           | 인증 필요   |
| ------ | ----------- | -------------- | ----------- |
| GET    | `/`         | 내 알림 목록   | ✅ User JWT |
| PATCH  | `/:id/read` | 알림 읽음 처리 | ✅ User JWT |
| GET    | `/settings` | 알림 설정 조회 | ✅ User JWT |
| PATCH  | `/settings` | 알림 설정 변경 | ✅ User JWT |

---

## 문의 (Inquiry)

**Base URL**: `/api/inquiry`

| Method | Endpoint | 설명           | 인증 필요   |
| ------ | -------- | -------------- | ----------- |
| POST   | `/`      | 문의 제출      | ✅ User JWT |
| GET    | `/my`    | 내 문의 목록   | ✅ User JWT |
| GET    | `/:id`   | 문의 상세 조회 | ✅ User JWT |

---

## 관리자 - 로그인 (Admin Auth)

**Base URL**: `/api/admin`

| Method | Endpoint  | 설명                | 인증 필요 |
| ------ | --------- | ------------------- | --------- |
| POST   | `/login`  | 관리자 로그인       | ❌        |
| GET    | `/health` | Admin API 상태 확인 | ❌        |

---

## 관리자 - 대시보드 (Admin Dashboard)

**Base URL**: `/api/admin`

| Method | Endpoint                 | 설명           | 인증 필요    |
| ------ | ------------------------ | -------------- | ------------ |
| GET    | `/stats`                 | 대시보드 통계  | ✅ Admin JWT |
| GET    | `/stats/visitors/weekly` | 주간 방문자 수 | ✅ Admin JWT |
| GET    | `/logs`                  | 로그 파일 목록 | ✅ Admin JWT |
| GET    | `/logs/view?path=...`    | 로그 파일 내용 | ✅ Admin JWT |

---

## 관리자 - 토픽 관리 (Admin Topics)

**Base URL**: `/api/admin/topics`

| Method | Endpoint                           | 설명                   | 인증 필요    |
| ------ | ---------------------------------- | ---------------------- | ------------ |
| GET    | `/`                                | 토픽 목록 (검색, 필터) | ✅ Admin JWT |
| GET    | `/published`                       | 발행된 토픽 목록       | ✅ Admin JWT |
| GET    | `/sidebar`                         | 사이드바용 토픽 목록   | ✅ Admin JWT |
| GET    | `/:topicId`                        | 토픽 상세              | ✅ Admin JWT |
| POST   | `/`                                | 새 토픽 생성           | ✅ Admin JWT |
| PATCH  | `/:topicId/status`                 | 토픽 상태 변경         | ✅ Admin JWT |
| POST   | `/:topicId/recollect`              | 기사 재수집            | ✅ Admin JWT |
| POST   | `/:topicId/collect-ai`             | AI 기반 기사 수집      | ✅ Admin JWT |
| POST   | `/:topicId/collect-latest`         | 최신 기사 수집         | ✅ Admin JWT |
| GET    | `/:topicId/articles`               | 토픽 기사 목록         | ✅ Admin JWT |
| PATCH  | `/:topicId/articles/order`         | 기사 순서 변경         | ✅ Admin JWT |
| POST   | `/:topicId/unpublish-all-articles` | 모든 기사 발행 취소    | ✅ Admin JWT |
| POST   | `/:topicId/delete-all-suggested`   | 추천 기사 전체 삭제    | ✅ Admin JWT |
| GET    | `/:topicId/votes`                  | 투표 통계 조회         | ✅ Admin JWT |

---

## 관리자 - 기사 관리 (Admin Articles)

**Base URL**: `/api/admin/articles`

| Method | Endpoint                | 설명           | 인증 필요    |
| ------ | ----------------------- | -------------- | ------------ |
| PATCH  | `/:articleId/publish`   | 기사 발행      | ✅ Admin JWT |
| PATCH  | `/:articleId/unpublish` | 기사 발행 취소 | ✅ Admin JWT |
| DELETE | `/:articleId`           | 기사 삭제      | ✅ Admin JWT |

---

## 관리자 - 사용자 관리 (Admin Users)

**Base URL**: `/api/admin/users`

| Method | Endpoint            | 설명                       | 인증 필요    |
| ------ | ------------------- | -------------------------- | ------------ |
| GET    | `/`                 | 사용자 목록 (검색, 페이징) | ✅ Admin JWT |
| GET    | `/:userId`          | 사용자 상세                | ✅ Admin JWT |
| PATCH  | `/:userId/suspend`  | 사용자 정지                | ✅ Admin JWT |
| PATCH  | `/:userId/activate` | 정지 해제                  | ✅ Admin JWT |

---

## 관리자 - 문의 관리 (Admin Inquiries)

**Base URL**: `/api/admin/inquiries`

| Method | Endpoint             | 설명           | 인증 필요    |
| ------ | -------------------- | -------------- | ------------ |
| GET    | `/`                  | 문의 목록      | ✅ Admin JWT |
| GET    | `/:inquiryId`        | 문의 상세      | ✅ Admin JWT |
| POST   | `/:inquiryId/reply`  | 문의 답변      | ✅ Admin JWT |
| PATCH  | `/:inquiryId/status` | 문의 상태 변경 | ✅ Admin JWT |

---

## 관리자 - 키워드 관리 (Admin Keywords)

**Base URL**: `/api/admin/keywords`

| Method | Endpoint      | 설명               | 인증 필요    |
| ------ | ------------- | ------------------ | ------------ |
| GET    | `/`           | 트렌딩 키워드 목록 | ✅ Admin JWT |
| POST   | `/`           | 키워드 추가        | ✅ Admin JWT |
| DELETE | `/:keywordId` | 키워드 삭제        | ✅ Admin JWT |

---

## 관리자 - 알림 발송 (Admin Notifications)

**Base URL**: `/api/admin`

| Method | Endpoint         | 설명                  | 인증 필요    |
| ------ | ---------------- | --------------------- | ------------ |
| POST   | `/notifications` | 알림 발송 (전체/그룹) | ✅ Admin JWT |

---

## 내부 API (Internal)

**Base URL**: `/api/internal`

| Method | Endpoint             | 설명                    | 인증 필요          |
| ------ | -------------------- | ----------------------- | ------------------ |
| POST   | `/send-notification` | 조건부 실시간 알림 발송 | ✅ Internal Secret |

> ⚠️ **주의**: 이 API는 Python 스크립트 등 내부 시스템 전용입니다. 프론트엔드에서 사용하지 마세요.

---

## 작업 실행 (Jobs)

**Base URL**: `/api/jobs`

| Method | Endpoint        | 설명                 | 인증 필요     |
| ------ | --------------- | -------------------- | ------------- |
| POST   | `/collect`      | RSS 수집 작업 트리거 | ✅ Job Secret |
| POST   | `/popularity`   | 인기도 계산 작업     | ✅ Job Secret |
| POST   | `/prune`        | 홈 기사 정리 작업    | ✅ Job Secret |
| POST   | `/vector-index` | 벡터 인덱싱 작업     | ✅ Job Secret |
| POST   | `/pipeline`     | 전체 파이프라인 실행 | ✅ Job Secret |
