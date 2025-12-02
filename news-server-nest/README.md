# Different News Backend (NestJS)

## 📝 프로젝트 개요

이 프로젝트는 [Different News](https://your-frontend-url.com) 애플리케이션의 백엔드 서비스입니다. 기존 Express.js 기반의 백엔드를 NestJS 프레임워크로 마이그레이션한 버전입니다. 뉴스 기사 수집, 토픽 관리, 사용자 인증, 실시간 채팅, 알림, 관리자 기능 등을 담당합니다.

이 백엔드는 [Different News Frontend (React)](/frontend)와 [데이터 수집/처리 스크립트](/backend/scripts)와 함께 모노레포 형태로 관리됩니다.

## ✨ 주요 기능

- **사용자 및 인증**: JWT 기반 인증, 사용자 관리
- **토픽 및 기사**: 뉴스 토픽 및 관련 기사 조회, 관리
- **실시간 채팅**: 토픽별 실시간 채팅, 메시지 신고 및 숨김 처리
- **알림 시스템**: 사용자 설정 기반 실시간 알림 발송
- **관리자 패널**: 토픽, 기사, 사용자, 문의 등 백엔드 데이터 관리
- **유틸리티**: S3 Presigned URL 생성 (파일 업로드), Python 스크립트 연동

## 🚀 기술 스택

- **프레임워크**: [NestJS](https://nestjs.com/) (TypeScript, Node.js)
- **데이터베이스**: MySQL
- **DB 드라이버**: `mysql2/promise` (Direct SQL queries)
- **실시간 통신**: Socket.IO
- **환경 변수 관리**: `@nestjs/config`
- **인증**: JWT (Passport.js)
- **API 문서화**: Swagger (OpenAPI)
- **클라우드 스토리지**: AWS S3 SDK v3 (Presigned URL)
- **배포 플랫폼**: Render (예정)

## ⚙️ 로컬 개발 환경 설정

이 백엔드 서비스를 로컬에서 실행하기 위한 단계입니다.

### 📋 전제 조건

- Node.js (v18 이상 권장)
- npm 또는 Yarn
- MySQL 데이터베이스 (Docker 또는 로컬 설치)
- Docker (선택 사항, 루트의 `docker-compose.yml` 사용 시)
- Python 3 (데이터 수집/처리 스크립트 실행 시 필요)

### 📦 설치

1.  **프로젝트 저장소 클론 및 이동**:
    ```bash
    git clone [YOUR_REPOSITORY_URL]
    cd [YOUR_REPOSITORY_NAME]/news-server-nest # 이 폴더 이름을 'backend'로 변경할 예정입니다.
    ```
2.  **의존성 설치**:
    ```bash
    npm install
    # 또는 yarn install
    ```

### 🔑 환경 변수 설정

`news-server-nest` 폴더 내에 `.env` 파일을 생성하고 다음 변수들을 설정합니다. `.env.example` 파일을 참고하세요.

```env
# Database Connection (MySQL)
DB_HOST=localhost
DB_PORT=3306 # Docker 사용 시 3306, 호스트에 직접 설치 시 다를 수 있음
DB_USER=root
DB_PASSWORD=your_db_root_password
DB_DATABASE=news

# JWT Authentication Secrets
USER_JWT_SECRET=your_user_jwt_secret_key_here # 사용자 JWT 서명용 비밀 키
USER_JWT_EXPIRES_IN=12h
ADMIN_JWT_SECRET=your_admin_jwt_secret_key_here # 관리자 JWT 서명용 비밀 키
ADMIN_JWT_EXPIRES_IN=24h

# AWS S3 Configuration (for file uploads)
AWS_REGION=your_aws_region # 예: ap-northeast-2
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name

# Internal API Secret (for secure communication with internal scripts/services)
INTERNAL_API_SECRET=your_strong_internal_api_secret # 내부 API 호출용 비밀 키

# Python Executable Path (if running Python scripts directly from NestJS)
PYTHON_EXECUTABLE_PATH=python3 # 또는 python (시스템 설정에 따라)
```

**⚠️ 중요:** `ADMIN_JWT_SECRET`, `INTERNAL_API_SECRET` 등 민감한 정보는 절대로 Git에 커밋하지 마세요. `.env.example` 파일은 변수의 구조만 보여주는 템플릿입니다. 실제 배포 환경(예: Render)에서는 해당 플랫폼의 환경 변수 관리 기능을 사용해야 합니다.

### ▶️ 애플리케이션 실행

```bash
# 개발 모드 (소스 코드 변경 시 자동 재시작)
npm run start:dev

# 프로덕션 모드 (빌드 후 실행)
# 1. 먼저 애플리케이션 빌드:
npm run build
# 2. 그 다음 실행:
npm run start:prod
```

### 🧪 테스트

```bash
# 유닛 테스트
npm run test

# 엔드투엔드 테스트
npm run test:e2e
```

## 📚 API 문서 (Swagger)

애플리케이션이 실행 중일 때 다음 주소에서 Swagger UI를 통해 API 문서를 확인할 수 있습니다:
`http://localhost:3002/api-docs` (기본 포트 3002)

## 🐳 Docker를 이용한 개발/배포

이 프로젝트는 Docker Compose를 이용한 통합 개발/배포 환경을 지원합니다. (자세한 내용은 프로젝트 루트의 `docker-compose.yml` 파일 참조)

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

```

```
