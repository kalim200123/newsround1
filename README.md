# 뉴스 커뮤니티 플랫폼 (News Community Platform)

![CI Status](https://github.com/kalim200123/newsround1/actions/workflows/ci.yml/badge.svg)

## 📖 프로젝트 소개

이 프로젝트는 다양한 정치적 성향을 가진 사용자들을 위해 언론사를 분류하여 뉴스를 제공하고, 관련 토픽을 중심으로 소통할 수 있는 뉴스 커뮤니티 플랫폼입니다.

## 🏗️ 시스템 아키텍처 및 배포 현황

### R&R (역할 분담)

- **Backend & DB & Frontend (Admin)**: 본인 담당 (Render, TiDB)
- **Frontend (User)**: 인턴 담당 (Vercel)

### 배포 환경

- **Backend**: [Render](https://render.com/) (Free Tier)
- **Database**: [TiDB](https://pingcap.com/tidb/) (MySQL Compatible)
- **Frontend (User)**: [Vercel](https://vercel.com/)

## 📂 프로젝트 구조 및 폴더 설명

이 저장소는 백엔드와 데이터 분석, 관리자 페이지를 포함하고 있습니다.

### 1. `backend` (NestJS API Server)

- **역할**: 뉴스 커뮤니티의 메인 백엔드 API 서버입니다.
- **기술 스택**: NestJS, TypeScript, Node.js
- **주요 기능**:
  - `src`: API 서버 소스 코드
  - `scripts`: 데이터 수집 및 분석을 위한 Python 스크립트 모음 (`rss_collector.py`, `vector_indexer.py` 등)

### 2. `frontend` (Admin UI)

- **역할**: 뉴스 데이터 및 토픽 관리를 위한 관리자 전용 대시보드입니다. (사용자용 웹사이트 아님)
- **기술 스택**: React, Vite, TypeScript
- **주요 라이브러리**:
  - `react-router-dom`: 라우팅
  - `chart.js` / `react-chartjs-2`: 데이터 시각화
  - `@dnd-kit`: 드래그 앤 드롭 인터페이스

### 3. 기타

- **사용자용 프론트엔드**: 별도의 리포지토리에서 관리되며 Vercel을 통해 배포 중입니다.

## 🚀 시작 가이드

### Docker Compose로 전체 실행 (권장)

루트 디렉토리에서 다음 명령어를 실행하면 백엔드, 프론트엔드(관리자), DB가 모두 실행됩니다.

```bash
docker-compose up --build
```

### 개별 실행

#### Backend (`backend`)

```bash
cd backend
npm install
npm run start:dev
```

#### Admin UI (`frontend`)

```bash
cd frontend
npm install
npm run dev
```

#### Data Analysis Scripts

백엔드 폴더 내 `scripts` 디렉토리에 위치합니다.

```bash
cd backend
# Python 의존성 설치 (필요 시)
pip install -r scripts/requirements.txt
# 스크립트 실행 예시
python scripts/rss_collector.py
```
