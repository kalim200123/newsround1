# Vercel 배포 가이드 (Frontend-User)

이 문서는 `frontend-user` 애플리케이션을 Vercel에 배포하는 방법을 설명합니다.

## 📋 사전 준비

### 1. Vercel 계정 생성

- [Vercel 웹사이트](https://vercel.com/)에 접속하여 GitHub 계정으로 가입합니다.

### 2. GitHub 리포지토리 준비

- 개인 리포지토리 (`kalim200123/newsround1`)의 `integrate-user-frontend` 브랜치가 최신 상태인지 확인합니다.

---

## 🚀 배포 전 준비 작업

### 1. Backend URL 변경

**중요:** 로컬 개발용 설정을 프로덕션용으로 변경해야 합니다.

#### 📄 `frontend-user/lib/constants.ts` 수정

**현재 (로컬 개발용):**

```typescript
export const BACKEND_BASE_URL = "http://localhost:3001";
```

**변경 후 (프로덕션용):**

```typescript
export const BACKEND_BASE_URL = "https://news02.onrender.com";
```

또는 환경 변수를 사용하는 방식으로 개선:

```typescript
export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
```

### 2. 변경사항 커밋 및 푸시

```bash
cd c:/Users/RST/.vscode/news
git add frontend-user/lib/constants.ts
git commit -m "chore: 프로덕션 백엔드 URL로 변경"
git push origin integrate-user-frontend
```

---

## 📦 Vercel 배포 단계

### 1. Vercel 대시보드 접속

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인합니다.
2. **"Add New Project"** 또는 **"Import Project"** 버튼을 클릭합니다.

### 2. GitHub 리포지토리 연결

1. **"Import Git Repository"** 선택
2. `kalim200123/newsround1` 리포지토리를 선택합니다.
3. **브랜치 선택**: `integrate-user-frontend`

### 3. 프로젝트 설정

#### 기본 설정

- **Project Name**: `newsround-user` (원하는 이름)
- **Framework Preset**: `Next.js` (자동 감지됨)
- **Root Directory**: `frontend-user` ✅ **중요!**
  - "Edit" 버튼 클릭 → `frontend-user` 입력

#### Build 설정 (자동 감지되지만 확인 필요)

- **Build Command**: `npm run build`
- **Output Directory**: `.next` (자동)
- **Install Command**: `npm install`

### 4. 환경 변수 설정 (선택사항)

만약 `constants.ts`에서 환경 변수를 사용하도록 수정했다면:

| Key                       | Value                         |
| ------------------------- | ----------------------------- |
| `NEXT_PUBLIC_BACKEND_URL` | `https://news02.onrender.com` |

### 5. 배포 시작

- **"Deploy"** 버튼 클릭
- 빌드 진행 상황을 실시간으로 확인할 수 있습니다.
- 보통 2-3분 소요됩니다.

---

## ✅ 배포 완료 후

### 1. 배포 URL 확인

배포가 완료되면 다음과 같은 URL이 생성됩니다:

- `https://your-project-name.vercel.app`

### 2. 동작 테스트

1. 배포된 URL에 접속합니다.
2. 주요 기능 확인:
   - 메인 페이지 로딩
   - 뉴스 피드 표시
   - 토픽 투표 기능
   - 채팅 기능

### 3. 문제 해결

배포는 성공했지만 페이지가 제대로 작동하지 않는 경우:

#### 백엔드 연결 확인

브라우저 개발자 도구 (F12) → Console 탭에서 에러 확인

- `CORS` 에러가 나는 경우: Backend에서 Vercel 도메인 허용 필요
- `Network Error`: Backend URL 설정 확인

#### 로그 확인

Vercel Dashboard → 프로젝트 선택 → "Functions" 탭에서 서버 로그 확인

---

## 🔄 재배포 (업데이트)

코드 수정 후 재배포하는 방법:

### 자동 배포 (권장)

```bash
# 코드 수정 후
git add .
git commit -m "업데이트 내용"
git push origin integrate-user-frontend
```

→ GitHub에 푸시하면 **Vercel이 자동으로 재배포**합니다.

### 수동 배포

Vercel Dashboard → 프로젝트 → "Deployments" → "Redeploy"

---

## 📌 체크리스트

배포 전 아래 항목을 확인하세요:

- [ ] `frontend-user/lib/constants.ts`의 `BACKEND_BASE_URL`이 프로덕션 URL로 변경됨
- [ ] 수정사항이 GitHub에 푸시됨
- [ ] Vercel 프로젝트 설정에서 Root Directory가 `frontend-user`로 지정됨
- [ ] 빌드가 성공적으로 완료됨
- [ ] 배포된 사이트가 정상 작동함

---

## 🆘 트러블슈팅

### 빌드 실패

**증상**: Vercel에서 빌드가 실패함
**해결**:

1. 로컬에서 `npm run build` 실행하여 에러 확인
2. `package.json`의 의존성 확인
3. Node.js 버전 호환성 확인

### 빈 페이지 또는 404

**증상**: 배포 후 빈 페이지만 표시됨
**해결**:

1. Root Directory 설정이 `frontend-user`로 되어 있는지 확인
2. Vercel 로그에서 라우팅 에러 확인

### CORS 에러

**증상**: API 호출 시 CORS 에러 발생
**해결**:
Backend (`backend/src/main.ts`)에서 Vercel 도메인 허용:

```typescript
app.enableCors({
  origin: ["http://localhost:3002", "https://your-project.vercel.app"],
  credentials: true,
});
```

---

## 💡 추가 팁

### 커스텀 도메인 연결

Vercel 프로젝트 → Settings → Domains에서 본인 소유의 도메인 연결 가능

### 성능 모니터링

Vercel Dashboard → Analytics에서 방문자 통계 및 성능 지표 확인 가능

### Preview 배포

Pull Request 생성 시 자동으로 Preview 배포가 생성되어 테스트 가능
