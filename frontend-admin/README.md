# 뉴스 커뮤니티 플랫폼 - 관리자 페이지 (Admin Frontend)

이 모듈은 뉴스 커뮤니티 플랫폼의 **컨텐츠 관리 및 운영**을 위한 관리자 전용 대시보드입니다.

## 🛠️ 기술 스택 (Tech Stack)

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: React Context API
- **Routing**: [React Router](https://reactrouter.com/)
- **Charts**: [Recharts](https://recharts.org/) (데이터 시각화)

## ✨ 주요 기능 (Features)

### 1. 📊 대시보드 (Dashboard)

- 일별 방문자 수 및 페이지 뷰 통계
- 실시간 인기 토픽 및 키워드 모니터링
- 시스템 상태 및 최근 활동 로그 확인

### 2. 🗳️ 토픽 관리 (Topic Management)

- **토픽 생성**: 새로운 토론 주제 생성 및 상세 정보 입력
- **상태 관리**: 준비 중(PENDING), 컬렉션 중(COLLECTING), 발행됨(OPEN) 상태 변경
- **큐레이션**: '진보', '중도', '보수' 3가지 관점의 기사를 선택하고 순서 배치

### 3. 📰 기사 및 키워드 관리 (Articles & Keywords)

- **기사 수집**: RSS를 통해 수집된 기사 목록 확인 및 상태 관리
- **크롤링 제어**: 특정 키워드에 대한 크롤링 실행
- **키워드 관리**: 트렌딩 키워드 편집 및 삭제

### 4. 👥 사용자 및 커뮤니티 관리 (User & Community)

- **사용자 관리**: 회원 목록 조회, 제재(Ban) 처리
- **댓글 관리**: 신고된 댓글 확인 및 숨김/삭제 처리
- **문의 관리**: 1:1 문의 내역 확인 및 답변 처리

## 🚀 실행 방법 (How to Run)

### 사전 준비 (Prerequisites)

- Node.js v18 이상
- 백엔드 서버가 3001번 포트에서 실행 중이어야 합니다.

### 설치 및 실행

1. **패키지 설치**

   ```bash
   npm install
   ```

2. **개발 서버 실행**

   ```bash
   npm run dev
   ```

   실행 후 `http://localhost:3000` 접속

3. **환경 변수 설정 (`.env`)**
   ```env
   VITE_API_URL=http://localhost:3001
   ```

## 📁 폴더 구조 (Folder Structure)

```
frontend-admin/
├── src/
│   ├── components/   # 재사용 가능한 UI 컴포넌트
│   ├── pages/        # 페이지 단위 컴포넌트 (라우팅)
│   ├── lib/          # 유틸리티 함수 및 API 클라이언트
│   ├── context/      # 전역 상태 (Auth 등)
│   └── styles/       # 글로벌 스타일
├── public/           # 정적 파일 (이미지, 아이콘)
└── ...설정 파일들
```
