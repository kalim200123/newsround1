# 뉴스 커뮤니티 플랫폼 (News Community Platform)

> ⚠️ **주의 (Warning)**
>
> 이 브랜치(`express-legacy`)는 **Express.js 기반의 구버전** 보관용 코드입니다.
> 최신 **NestJS 기반** 코드를 보시려면 `main` 브랜치를 확인해주세요.
>
> This branch contains the legacy **Express.js** implementation for archival purposes.
> For the latest **NestJS** version, please switch to the `main` branch.

## 📖 프로젝트 소개

이 프로젝트는 다양한 정치적 성향을 가진 사용자들을 위해 언론사를 분류하여 뉴스를 제공하고, 관련 토픽을 중심으로 소통할 수 있는 뉴스 커뮤니티 플랫폼입니다.

## 📂 프로젝트 구조 (Legacy - Express.js)

```
news/
├── backend-express/   # Express.js 기반 백엔드 서버 (레거시)
├── docker-compose.yml
├── nginx.conf
└── README.md
```

### `backend-express` (Backend - Express.js)

- **역할**: 뉴스 커뮤니티의 메인 백엔드 API 서버 (Express.js 버전)
- **기술 스택**: Node.js, Express.js, TypeScript
- **주요 라이브러리**:
  - `mysql2`: 데이터베이스 연결
  - `socket.io`: 실시간 통신
  - `aws-sdk`: 파일 스토리지 연동
  - `rss-parser`: RSS 피드 수집
  - `swagger-ui-express`: API 문서화

## 🚀 시작 가이드 (Legacy)

### Backend (`backend-express`)

```bash
cd backend-express
npm install
npm start
```

## 📌 참고사항

- 이 브랜치는 **보관 목적**으로 유지되며, 새로운 기능 개발은 `main` 브랜치에서 진행됩니다.
- 최신 NestJS 기반 코드는 더 나은 구조와 성능을 제공합니다.
- 프론트엔드와 데이터 분석 스크립트는 `main` 브랜치에서 확인하실 수 있습니다.
