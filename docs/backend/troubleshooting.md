# 트러블슈팅 가이드 (Troubleshooting Guide)

이 문서는 자주 발생하는 오류와 해결 방법을 정리한 것입니다.

---

## 🐳 Docker 관련 오류

### 1. `ERR_REQUIRE_ESM` - uuid 패키지 오류

**증상:**

```
Error [ERR_REQUIRE_ESM]: require() of ES Module .../uuid/dist-node/index.js not supported
```

**원인:**

- `uuid` v10 이상은 ESM(ECMAScript Modules)만 지원합니다.
- NestJS 프로젝트는 CommonJS로 컴파일되므로 호환되지 않습니다.

**해결:**

```bash
# backend/package.json 수정
"uuid": "^9.0.1"
"@types/uuid": "^9.0.0"

# 의존성 재설치
npm install
```

---

### 2. Python 라이브러리 빌드 실패 (Alpine)

**증상:**

```
error: failed to solve: process "/bin/sh -c pip install ..." did not complete successfully: exit code: 1
```

**원인:**

- Alpine Linux에서 `numpy`, `scikit-learn` 등을 컴파일하려면 메모리가 부족하거나 시간이 오래 걸립니다.

**해결:**
`backend/Dockerfile`을 수정하여 `node:18-slim` (Debian 기반) 사용:

```dockerfile
FROM node:18-slim AS builder
# Alpine 대신 Debian 기반 이미지 사용
# 미리 빌드된 바이너리(Wheel)를 설치할 수 있어 빠르고 안정적
```

---

### 3. Docker 빌드 시 메모리 부족

**증상:**

- 빌드가 매우 느리거나 중간에 멈춤.

**해결:**

- Python virtual environment(venv) 사용으로 의존성 격리:

```dockerfile
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
```

---

## 🐍 Python 스크립트 오류

### 1. 임베딩 모델 메모리 초과

**증상:**

- `vector_indexer.py` 실행 시 메모리 부족으로 종료.

**원인:**

- `intfloat/multilingual-e5-base` 모델이 무료 호스팅 환경에 비해 너무 큽니다.

**해결:**
더 작은 모델로 변경:

```python
# backend/scripts/vector_indexer.py
model = SentenceTransformer('intfloat/multilingual-e5-small')  # base -> small (메모리 부족 시)
```

최근 3일 기사만 인덱싱:

```python
WHERE published_at >= NOW() - INTERVAL 3 DAY
```

---

### 2. Python 스크립트 경로 오류

**증상:**

```
FileNotFoundError: [Errno 2] No such file or directory: '../news-data/...'
```

**원인:**

- 프로젝트 구조 변경 후 경로가 업데이트되지 않음.

**해결:**
`backend/src/jobs/jobs.service.ts` 또는 `admin-topics.service.ts`에서 경로 수정:

```typescript
// 기존 (잘못됨)
["news-data", "script.py"][
  // 수정 (올바름)
  ("scripts", "script.py")
];
```

---

## 🔐 인증 오류

### 1. JWT 토큰 만료

**증상:**

```json
{ "statusCode": 401, "message": "Unauthorized" }
```

**원인:**

- 토큰이 만료되었거나 잘못된 시크릿으로 서명됨.

**해결:**

- 프론트엔드에서 로그아웃 후 재로그인.
- `.env` 파일의 `USER_JWT_SECRET`, `ADMIN_JWT_SECRET` 확인.

---

### 2. 관리자 권한 없음

**증상:**

```json
{ "statusCode": 403, "message": "Forbidden resource" }
```

**원인:**

- `AdminGuard`가 적용된 엔드포인트에 일반 사용자 JWT로 접근.

**해결:**

- 관리자 계정으로 로그인하여 Admin JWT 발급받기.
- `/api/admin/login` 사용.

---

## 🗄️ 데이터베이스 오류

### 1. 외래 키 제약 조건 위반

**증상:**

```
Cannot delete or update a parent row: a foreign key constraint fails
```

**원인:**

- 참조되고 있는 레코드를 삭제하려고 시도.

**해결:**

- 먼저 자식 레코드를 삭제하거나,
- `ON DELETE CASCADE`가 설정되어 있는지 확인.

---

### 2. 중복 키 오류

**증상:**

```
Duplicate entry '...' for key 'unique_...'
```

**원인:**

- `UNIQUE` 제약 조건이 있는 컬럼에 중복된 값 삽입.

**해결:**

- 토픽: `display_name`이 고유해야 함.
- 사용자: `email`, `nickname`이 고유해야 함.

---

## 🚀 배포 오류 (Render)

### 1. 빌드 시간 초과

**증상:**

- Render 무료 티어에서 빌드가 15분을 초과하여 실패.

**해결:**

- `node:18-slim` 사용으로 빌드 시간 단축.
- 불필요한 `devDependencies` 제거.
- Layer caching 최적화 (Dockerfile에서 `COPY` 순서 조정).

---

### 2. 환경 변수 누락

**증상:**

```
Error: DB_HOST is not defined
```

**해결:**

- Render 대시보드에서 Environment Variables 설정:
  - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
  - `USER_JWT_SECRET`, `ADMIN_JWT_SECRET`
  - `INTERNAL_API_SECRET`

---

## ⚡ 성능 문제

### 1. API 응답 속도 느림

**원인:**

- N+1 쿼리 문제.
- 인덱스 누락.

**해결:**

- JOIN을 사용하여 한 번에 데이터 가져오기.
- 자주 조회되는 컬럼에 인덱스 추가 (예: `topic_id`, `user_id`).

---

### 2. Socket.IO 연결 끊김

**증상:**

- 채팅 메시지가 전달되지 않음.

**원인:**

- WebSocket 프록시 설정 문제.
- JWT 인증 실패.

**해결:**

- Nginx 설정에서 WebSocket 프록시 활성화.
- 클라이언트에서 JWT를 `auth` 옵션으로 전달:

```javascript
const socket = io(SERVER_URL, {
  auth: { token: userToken },
});
```

---

## 📝 로그 확인 방법

### 로컬 개발

```bash
# NestJS 로그
npm run start:dev

# Docker Compose 로그
docker-compose logs -f news-server
```

### Render 배포

1.  Render 대시보드 → 서비스 선택
2.  **Logs** 탭에서 실시간 로그 확인
3.  **Events** 탭에서 배포 이력 확인

---

## 🆘 추가 도움이 필요한 경우

1.  **Swagger API 문서**: `http://localhost:3002/api-docs`
2.  **GitHub Issues**: 프로젝트 저장소에서 검색
3.  **공식 문서**:
    - [NestJS](https://docs.nestjs.com/)
    - [Socket.IO](https://socket.io/docs/)
    - [TiDB](https://docs.pingcap.com/tidb/stable)
