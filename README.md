# 뉴스 커뮤니티 플랫폼 (News Community Platform)

## 📖 프로젝트 소개
이 프로젝트는 다양한 정치적 성향을 가진 사용자들을 위해 언론사를 분류하여 뉴스를 제공하고, 관련 토픽을 중심으로 소통할 수 있는 뉴스 커뮤니티 플랫폼입니다.

## 🏗️ 시스템 아키텍처 및 배포 현황

### R&R (역할 분담)
- **Backend & DB**: 본인 담당 (Render, TiDB)
- **Frontend (User)**: 인턴 담당 (Vercel)

### 배포 환경
- **Backend**: [Render](https://render.com/) (Free Tier)
- **Database**: [TiDB](https://pingcap.com/ai/tidb/) (MySQL Compatible)
- **Frontend (User)**: [Vercel](https://vercel.com/)

## 📂 프로젝트 구조 및 폴더 설명

이 저장소는 백엔드와 데이터 분석, 관리자 페이지를 포함하고 있습니다.

### 1. `news-server` (Backend)
- **역할**: 뉴스 커뮤니티의 메인 백엔드 API 서버입니다.
- **기술 스택**: Node.js, Express, TypeScript
- **주요 라이브러리**:
  - `mysql2`: 데이터베이스 연결
  - `socket.io`: 실시간 통신
  - `aws-sdk`: 파일 스토리지 연동
  - `rss-parser`: RSS 피드 수집
  - `swagger-ui-express`: API 문서화

### 2. `news-ui` (Admin Frontend)
- **역할**: 뉴스 데이터 및 토픽 관리를 위한 관리자 전용 대시보드입니다. (사용자용 웹사이트 아님)
- **기술 스택**: React, Vite, TypeScript
- **주요 라이브러리**:
  - `react-router-dom`: 라우팅
  - `chart.js` / `react-chartjs-2`: 데이터 시각화
  - `@dnd-kit`: 드래그 앤 드롭 인터페이스

### 3. `news-data` (Data Analysis)
- **역할**: 수집된 기사를 분석하고 처리하는 Python 스크립트 모음입니다.
- **기술 스택**: Python
- **주요 라이브러리**:
  - `beautifulsoup4`: 웹 크롤링 및 파싱
  - `scikit-learn`, `sentence-transformers`: 텍스트 유사도 분석 및 ML 작업
  - `mysql-connector-python`: DB 연동

### 4. 기타 폴더
- **`news-server-nest`**: 마이그레이션 테스트용 폴더입니다. (현재 프로덕션 미사용, 참고용)
- **`db`**: 현재 사용하지 않는 폴더입니다.
- **사용자용 프론트엔드**: 별도의 리포지토리에서 관리되며 Vercel을 통해 배포 중입니다.

## 🚀 시작 가이드

### Backend (`news-server`)
```bash
cd news-server
npm install
npm start
```

### Admin UI (`news-ui`)
```bash
cd news-ui
npm install
npm run dev
```

### Data Analysis (`news-data`)
```bash
cd news-data
pip install -r requirements.txt
python article_collector.py # 예시 실행
```
