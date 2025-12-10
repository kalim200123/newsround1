# 뉴스 커뮤니티 플랫폼 (News Community Platform)

![CI Status](https://github.com/kalim200123/newsround1/actions/workflows/ci.yml/badge.svg)

## 📖 프로젝트 소개

이 프로젝트는 다양한 정치적 성향을 가진 사용자들을 위해 언론사를 분류하여 뉴스를 제공하고, 관련 토픽을 중심으로 소통할 수 있는 **뉴스 커뮤니티 플랫폼**입니다.

이 리포지토리는 **개인 학습 및 포트폴리오용 통합 버전**으로, 백엔드/관리자 프론트엔드/사용자 프론트엔드가 모두 포함되어 있습니다.

---

## 🏗️ 시스템 아키텍처

### 모노레포 구조

이 프로젝트는 하나의 리포지토리에서 세 가지 주요 모듈을 관리합니다.

| 모듈명             | 경로              | 역할                               | 기술 스택               | 로컬 포트 |
| ------------------ | ----------------- | ---------------------------------- | ----------------------- | --------- |
| **Backend**        | `/backend`        | 데이터 수집/가공 및 API 서버       | NestJS, Python (Script) | **3001**  |
| **Admin Frontend** | `/frontend-admin` | 데이터 및 토픽 관리용 대시보드     | React, Vite             | **3000**  |
| **User Frontend**  | `/frontend-user`  | 실제 사용자가 이용하는 서비스 화면 | Next.js (App Router)    | **3002**  |

### 데이터베이스

- **TiDB Cloud**: MySQL 호환 분산 데이터베이스 사용

---

## 🚀 퀵 스타트 가이드 (Quick Start)

로컬 개발 환경에서 전체 시스템을 구동하는 방법입니다.

### 1. 사전 준비 (Prerequisites)

- [Node.js](https://nodejs.org/) (v18 이상 권장)
- Python 3.8+ (데이터 수집 스크립트 실행 시 필요)

### 2. 백엔드 실행 (Backend)

데이터베이스 연결을 위해 `.env` 파일 설정이 필요합니다.

```bash
cd backend
npm install
npm run start:dev
# 실행 확인: http://localhost:3001/api-docs (Swagger)
```

### 3. 관리자 프론트엔드 실행 (Admin)

```bash
cd frontend-admin
npm install
npm run dev
# 실행 확인: http://localhost:3000
```

### 4. 사용자 프론트엔드 실행 (User)

```bash
cd frontend-user
npm install
npm run dev
# 실행 확인: http://localhost:3002
```

---

## 📂 폴더별 상세 설명

### 1. `backend` (API Server)

- **주요 기능**: 인증, 토픽/기사 관리, 댓글/투표 로직, 배너 및 데이터 분석
- **스크립트 (`/backend/scripts`)**:
  - `rss_collector.py`: 뉴스 RSS 데이터 수집
  - `vector_indexer.py`: 기사 유사도 분석 및 벡터 인덱싱
- **API 문서**: 서버 실행 후 `/api-docs` 접속 시 Swagger 확인 가능

### 2. `frontend-admin` (Management Dashboard)

- **목적**: 서비스 운영자가 컨텐츠를 큐레이션하고 사용자를 관리하는 도구
- **주요 기능**:
  - 대시보드 (방문자 통계 등)
  - 토픽 생성 및 상태 관리
  - 기사 큐레이션 (진보/중도/보수 분류)
  - 회원 및 댓글 관리

### 3. `frontend-user` (User Service Interface)

- **목적**: 일반 사용자가 뉴스를 소비하고 커뮤니티 활동을 하는 웹 애플리케이션
- **디자인**: 반응형 웹 디자인, 다크 모드 지원
- **주요 기능**:
  - 뉴스 피드 및 카테고리별 보기
  - 토픽 투표 및 토론 (채팅)
  - 실시간 인기 검색어 및 속보 확인

---

## 🔗 관련 문서

- [Backend API Endpoints](docs/backend/api_endpoints.md)
- [Troubleshooting Guide](docs/backend/troubleshooting.md)
