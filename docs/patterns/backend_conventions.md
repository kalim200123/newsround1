# 백엔드 코딩 컨벤션 (news-server)

## 1. 일반 원칙

- **언어**: TypeScript (Strict 모드 권장).
- **프레임워크**: Express.js.
- **데이터베이스**: TiDB (MySQL 호환), `mysql2` 드라이버 사용.

## 2. 파일 구조

- **Routes**: `src/routes/*.ts` - 엔드포인트 정의 및 요청/응답 로직 처리.
  - _참고_: 현재 비즈니스 로직이 라우트 파일에 섞여 있는 경우가 많습니다. 복잡한 기능의 경우 함수나 서비스로 분리하는 것을 고려하세요.
- **Middleware**: `src/middleware/*.ts` - 인증, 유효성 검사, 에러 처리.
- **Config**: `src/config/*.ts` - DB 연결, 환경 변수 설정.

## 3. 명명 규칙

- **파일**: `kebab-case.ts` (예: `article-collector.ts`) 또는 `camelCase.ts` (기존 파일들은 `jobs.ts`처럼 camelCase 사용). -> **기존 `camelCase.ts` 따름**.
- **변수/함수**: `camelCase`.
- **클래스**: `PascalCase`.
- **상수**: `UPPER_SNAKE_CASE`.
- **DB 테이블**: `snake_case` (예: `tn_article`, `tn_user`).

## 4. API 설계

- **URL**: RESTful 스타일 (예: `GET /api/articles/:id`).
- **응답 형식**:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null
  }
  ```
- **에러 처리**: `try-catch` 블록 사용. 적절한 HTTP 상태 코드 반환 (400, 401, 404, 500).

## 5. 데이터베이스

- **쿼리**: SQL 인젝션 방지를 위해 파라미터화된 쿼리(`?`) 사용.
- **Async/Await**: DB 호출 시 항상 `await` 사용.

## 6. Git 및 커밋

- **커밋 메시지**: **한글 제목** (필수).
- **프로세스**: 사용자가 스테이징/푸시 담당. 에이전트는 메시지 제안.
