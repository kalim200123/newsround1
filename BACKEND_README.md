# 백엔드 (Backend) 문서

## 개요

뉴스 커뮤니티 플랫폼의 백엔드 API 서버로, 사용자 인증, 토픽 관리, 투표 시스템, 실시간 채팅, 댓글, 문의 처리 등의 핵심 비즈니스 로직을 담당합니다. RESTful API와 WebSocket을 통해 프론트엔드(사용자 앱, 관리자 대시보드)와 통신하며, TiDB Cloud(MySQL 호환)를 데이터베이스로 사용합니다.

## 주요 역할 및 기술 스택

### 핵심 역할

- **사용자 인증 및 권한 관리**: JWT 기반 사용자/관리자 인증
- **토픽 및 기사 관리**: 뉴스 토픽 생성, 큐레이션, 발행
- **투표 시스템**: 토픽에 대한 사용자 입장(좌/우) 투표
- **실시간 채팅**: Socket.io 기반 토픽별 채팅방
- **댓글 및 문의**: 토픽 댓글, 1:1 문의 처리
- **데이터 수집 및 분석**: Python 스크립트를 통한 RSS 수집, 벡터화, 유사도 분석

### 기술 스택

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: MySQL (TiDB Cloud)
- **Authentication**: Passport.js, JWT
- **Real-time**: Socket.io (WebSocket)
- **API Documentation**: Swagger (OpenAPI)
- **Data Processing**: Python (RSS 수집, 벡터 임베딩, 유사도 분석)
- **Storage**: AWS S3 (파일 업로드, 선택적 사용)

## 시작하기

### 환경 변수 설정

`.env` 파일을 루트 디렉토리에 생성하고 다음 변수를 설정합니다:

```env
# Database
DB_HOST=your-tidb-host
DB_PORT=4000
DB_USER=your-username
DB_PASSWORD=your-password
DB_DATABASE=your-database

# JWT Secrets
USER_JWT_SECRET=your-user-jwt-secret
ADMIN_JWT_SECRET=your-admin-jwt-secret

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password

# Internal API
INTERNAL_API_SECRET=your-internal-secret

# S3 (Optional)
USE_S3=false
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run start:dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm run start:prod
```

서버는 기본적으로 `http://localhost:3001`에서 실행되며, Swagger 문서는 `http://localhost:3001/api-docs`에서 확인할 수 있습니다.

## 프로젝트 구조

```
backend/
├── src/
│   ├── admin/              # 관리자 기능 (통계, 토픽/사용자/문의 관리)
│   ├── auth/               # 사용자 인증 (로그인, 회원가입)
│   ├── articles/           # 기사 조회 및 검색
│   ├── topics/             # 토픽 조회, 투표
│   ├── comments/           # 토픽 댓글
│   ├── chat/               # 실시간 채팅 (WebSocket)
│   ├── inquiry/            # 1:1 문의
│   ├── keywords/           # 트렌딩 키워드
│   ├── notifications/      # 알림 시스템
│   ├── user/               # 사용자 프로필 관리
│   ├── saved/              # 북마크 (저장한 기사/토픽)
│   ├── jobs/               # 스케줄 작업 (Cron)
│   ├── database/           # DB 연결 설정
│   ├── config/             # 환경 설정
│   ├── common/             # 공통 유틸리티
│   └── main.ts             # 애플리케이션 진입점
├── scripts/                # Python 데이터 처리 스크립트
│   ├── rss_collector.py           # RSS 피드 수집
│   ├── daily_vectorizer.py        # 기사 벡터 임베딩
│   ├── topic_matcher_db.py        # 토픽-기사 매칭
│   ├── popularity_calculator.py   # 인기도 계산
│   └── ...
└── test/                   # 테스트 코드
```

## API 엔드포인트

### 주요 API 그룹

#### 1. 인증 (Auth)

- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보 조회

#### 2. 토픽 (Topics)

- `GET /api/topics` - 발행된 토픽 목록 조회
- `GET /api/topics/:topicId` - 토픽 상세 및 기사 조회
- `POST /api/topics/:topicId/stance-vote` - 입장 투표
- `POST /api/topics/:topicId/view` - 조회수 증가

#### 3. 관리자 (Admin)

- `POST /api/admin/login` - 관리자 로그인
- `GET /api/admin/stats` - 대시보드 통계
- `GET /api/admin/topics` - 토픽 관리 (목록, 생성, 수정, 삭제)
- `GET /api/admin/users` - 사용자 관리
- `GET /api/admin/inquiries` - 문의 관리
- `GET /api/admin/trending-keywords` - 키워드 관리

#### 4. 채팅 (Chat - WebSocket)

- `connection` - 채팅방 연결
- `send_message` - 메시지 전송
- `report_message` - 메시지 신고

#### 5. 댓글 (Comments)

- `GET /api/topics/:topicId/comments` - 댓글 목록 조회
- `POST /api/topics/:topicId/comments` - 댓글 작성
- `DELETE /api/comments/:commentId` - 댓글 삭제

### Swagger 문서

전체 API 문서는 서버 실행 후 `http://localhost:3001/api-docs`에서 확인할 수 있습니다.

## 핵심 기능 및 로직

### 1. 인증 시스템 (Authentication)

- **사용자 인증**: Passport JWT 전략을 사용하여 사용자 로그인 처리
- **관리자 인증**: 별도의 JWT 시크릿을 사용하여 관리자 권한 분리
- **Guards**: `JwtAuthGuard`, `AdminGuard`, `OptionalJwtAuthGuard`를 통한 엔드포인트 보호

**코드 위치**: `src/auth/`, `src/admin/admin.guard.ts`

### 2. 토픽 관리 (Topic Management)

- **토픽 생성**: 키워드 입력 시 관련 기사 자동 추천 (벡터 유사도 기반)
- **토픽 발행**: 관리자가 세부 정보(요약, 투표 기간, 주장)를 입력 후 발행
- **토픽 상태**: `PREPARING` (준비 중) → `OPEN` (발행됨) → `CLOSED` (종료)
- **기사 큐레이션**: 좌(진보)/중도/우(보수) 진영별 기사 분류 및 순서 관리

**코드 위치**: `src/admin/topics/`, `src/topics/`

### 3. 투표 시스템 (Voting)

- **입장 투표**: 사용자는 토픽에 대해 `LEFT` (진보) 또는 `RIGHT` (보수) 중 하나를 선택
- **투표 제한**: 한 사용자당 토픽별 1회 투표, 투표 후 변경 불가
- **투표 통계**: 실시간 집계 및 퍼센티지 계산

**코드 위치**: `src/topics/topics.service.ts`

### 4. 실시간 채팅 (Real-time Chat)

- **WebSocket 연결**: Socket.io를 사용한 양방향 통신
- **토픽별 채팅방**: 각 토픽마다 독립적인 채팅 네임스페이스
- **신고 시스템**: 메시지 신고 시 자동 숨김 처리 (신고 임계값 초과 시)
- **인증**: JWT 토큰 검증을 통한 사용자 확인

**코드 위치**: `src/chat/chat.gateway.ts`

### 5. 조회수 및 인기도 계산

- **조회수**: IP 또는 사용자 ID 기반 24시간 중복 방지
- **인기도 점수**: `투표수 + 댓글수 × 10 + 조회수`로 계산하여 토픽 순위 결정

**코드 위치**: `src/topics/topics.service.ts`, `scripts/popularity_calculator.py`

## Scripts 설명 (데이터 처리)

백엔드는 Python 스크립트를 통해 뉴스 데이터 수집, 처리, 분석을 자동화합니다.

### 1. `rss_collector.py`

- **역할**: 주요 언론사의 RSS 피드를 수집하여 `tn_home_article` 테이블에 저장
- **수집 대상**: 한경오(한겨레, 경향, 오마이뉴스), 조중동(조선, 중앙, 동아), 연합뉴스 등
- **스케줄**: 주기적으로 실행 (Cron 또는 수동)

### 2. `daily_vectorizer.py`

- **역할**: 수집된 기사를 벡터 임베딩하여 유사도 검색 준비
- **모델**: `intfloat/multilingual-e5-small` (다국어 임베딩 모델)
- **저장**: 벡터 데이터를 MySQL JSON 컬럼에 저장

### 3. `topic_matcher_db.py`

- **역할**: 토픽의 키워드와 기사 간 유사도를 계산하여 관련 기사를 자동 매칭
- **알고리즘**: 코사인 유사도(Cosine Similarity)
- **결과**: 유사도 임계값 이상의 기사를 `tn_article`에 `suggested` 상태로 추가

### 4. `popularity_calculator.py`

- **역할**: 토픽의 인기도 점수를 계산하여 `tn_topic.popularity_score` 업데이트
- **스케줄**: 주기적으로 실행하여 실시간 인기 토픽 반영

### 5. `search_query_embedder.py`

- **역할**: 사용자 검색 쿼리를 임베딩하여 벡터 검색 수행

### 6. `run_pipeline.py`

- **역할**: 여러 스크립트를 순차적으로 실행하는 파이프라인
- **순서**: RSS 수집 → 벡터화 → 토픽 매칭 → 인기도 계산

### Python 환경 설정

```bash
# 가상환경 생성 및 활성화
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 의존성 설치
pip install -r scripts/requirements.txt

# 스크립트 실행 예시
python scripts/rss_collector.py
python scripts/daily_vectorizer.py
```

---

## 참고 링크

- **Swagger API 문서**: `http://localhost:3001/api-docs`
- **데이터베이스 스키마**: `ERD.md` 참조
- **개인 PC 실행 가이드**: `PERSONAL_PC_SETUP.md` 참조
