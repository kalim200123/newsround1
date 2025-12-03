# 배포 가이드 (Deployment Guide)

이 문서는 Render 플랫폼에 백엔드를 배포하는 전체 과정을 설명합니다.

---

## 📋 사전 준비

### 필수 사항

1.  **GitHub 저장소**: 코드가 GitHub에 푸시되어 있어야 합니다.
2.  **Render 계정**: [render.com](https://render.com)에 가입.
3.  **TiDB 데이터베이스**: [TiDB Cloud](https://tidbcloud.com)에서 무료 클러스터 생성.

---

## 🚀 Render 배포 절차

### 1단계: 새 Web Service 생성

1.  Render 대시보드에서 **"New +"** → **"Web Service"** 클릭.
2.  GitHub 저장소 연결.
3.  배포할 저장소와 브랜치 선택 (예: `main`).

### 2단계: 서비스 설정

| 항목               | 값                                |
| ------------------ | --------------------------------- |
| **Name**           | `news-backend` (또는 원하는 이름) |
| **Region**         | `Singapore` (서울과 가까움, 무료) |
| **Branch**         | `main`                            |
| **Root Directory** | `backend` ⚠️ **중요!**            |
| **Runtime**        | `Docker`                          |
| **Instance Type**  | `Free`                            |

### 3단계: 환경 변수 설정

**Environment** 탭에서 다음 변수들을 추가:

#### 데이터베이스

```
DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your_tidb_user
DB_PASSWORD=your_tidb_password
DB_DATABASE=news
```

#### JWT 시크릿

```
USER_JWT_SECRET=your_super_secret_user_jwt_key_here
USER_JWT_EXPIRES_IN=12h
ADMIN_JWT_SECRET=your_super_secret_admin_jwt_key_here
ADMIN_JWT_EXPIRES_IN=24h
```

#### 내부 API

```
INTERNAL_API_SECRET=your_internal_api_secret_here
JOB_TRIGGER_SECRET=your_job_trigger_secret_here
```

#### AWS S3 (선택)

```
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET_NAME=your_bucket_name
USE_S3=false  # S3 사용 안 할 경우
```

#### Python 설정

```
PYTHON_EXECUTABLE_PATH=python3
ENABLE_AI_COLLECTION=false  # 메모리 절약용
```

#### 관리자 계정

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_admin_password
```

### 4단계: 배포

1.  **"Create Web Service"** 클릭.
2.  자동으로 Docker 이미지 빌드 시작.
3.  빌드 로그를 확인하며 대기 (약 10-15분).

---

## ✅ 배포 확인

### 1. 헬스 체크

배포 완료 후 URL 확인:

```
https://news-backend.onrender.com/api/admin/health
```

예상 응답:

```json
{ "status": "ok" }
```

### 2. Swagger API 문서

```
https://news-backend.onrender.com/api-docs
```

---

## 🔄 재배포 (업데이트)

### 자동 재배포

GitHub의 `main` 브랜치에 푸시하면 자동으로 재배포됩니다:

```bash
git add .
git commit -m "feat: 새 기능 추가"
git push origin main
```

### 수동 재배포

Render 대시보드에서 **"Manual Deploy"** → **"Deploy latest commit"** 클릭.

---

## ⚡ 빌드 시간 단축 팁

### 1. Dockerfile 최적화

```dockerfile
# Layer caching 최대화를 위해 변경이 적은 파일 먼저 COPY
COPY backend/package*.json ./
RUN npm install

# 소스 코드는 나중에 복사
COPY backend/ ./
```

### 2. 불필요한 파일 제외

`.dockerignore` 파일:

```
node_modules
dist
*.log
.env
```

### 3. Virtual Environment 사용

Python 의존성을 venv로 격리하여 재빌드 시 캐싱 효과:

```dockerfile
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
```

---

## 📊 모니터링

### 로그 확인

Render 대시보드 → **Logs** 탭:

- 실시간 애플리케이션 로그 확인.
- 오류 발생 시 즉시 확인 가능.

### 이벤트 히스토리

**Events** 탭:

- 배포 성공/실패 이력.
- 빌드 시간, 재시작 기록.

### 메트릭

**Metrics** 탭 (유료 플랜):

- CPU, 메모리 사용량.
- 요청 수, 응답 시간.

---

## 🐛 배포 실패 시 대처

### 1. 빌드 로그 확인

**Logs** 탭에서 오류 메시지 찾기:

- `npm install` 실패 → `package.json` 확인.
- Docker 빌드 실패 → `Dockerfile` 문법 확인.
- Python 라이브러리 오류 → `requirements.txt` 확인.

### 2. 자주 발생하는 오류

- **`uuid` ESM 오류**: `package.json`에서 `uuid: ^9.0.1` 사용.
- **메모리 부족**: `node:18-slim` 사용, Python 모델을 `e5-small`로 변경 (기본값: `e5-base`).
- **환경 변수 누락**: Render 대시보드에서 모든 변수 설정 확인.

### 3. 롤백

이전 배포로 되돌리기:

1.  **Events** 탭에서 성공한 이전 배포 찾기.
2.  **"Redeploy"** 클릭.

---

## 🔐 보안 고려사항

### 1. 시크릿 키 관리

- **절대 코드에 하드코딩하지 마세요!**
- Render의 Environment Variables만 사용.
- `.env` 파일은 `.gitignore`에 추가.

### 2. CORS 설정

프론트엔드 도메인만 허용:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: ["https://your-frontend.vercel.app"],
  credentials: true,
});
```

### 3. Rate Limiting

DDoS 방지를 위한 요청 제한:

```typescript
import rateLimit from "express-rate-limit";

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // IP당 100개 요청
  })
);
```

---

## 💰 비용 최적화 (무료 티어)

### Render 무료 티어 제약

- **빌드 시간**: 최대 15분.
- **메모리**: 512MB.
- **비활성 시 슬립**: 15분 동안 요청이 없으면 서비스 중지 (첫 요청 시 재시작).

### 최적화 전략

1.  **경량 이미지 사용**: `node:18-slim`.
2.  **AI 기능 비활성화**: `ENABLE_AI_COLLECTION=false`.
3.  **작은 Python 모델**: `e5-small`.
4.  **Cron 작업 최소화**: 필요한 작업만 실행.

---

## 📞 문제 해결 연락처

1.  **Render 공식 문서**: https://render.com/docs
2.  **Render 커뮤니티**: https://community.render.com
3.  **TiDB 문서**: https://docs.pingcap.com/tidb/stable

---

## 🎯 다음 단계

배포 완료 후:

1.  ✅ 프론트엔드에서 API URL 업데이트.
2.  ✅ 관리자 계정으로 로그인 테스트.
3.  ✅ 첫 토픽 생성 및 발행.
4.  ✅ 사용자용 프론트엔드 배포 (Vercel).
