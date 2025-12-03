# 백엔드 코딩 컨벤션 (Backend)

## 1. 일반 원칙

- **언어**: TypeScript (Strict 모드 권장).
- **프레임워크**: NestJS.
- **데이터베이스**: TiDB (MySQL 호환), `mysql2` 드라이버 사용.

## 2. 파일 구조

- **프로젝트 루트**: `backend/` - 백엔드 전체 코드.
- **소스 코드**: `backend/src/` - 메인 애플리케이션 코드.
  - **Controllers**: `src/*/*.controller.ts` - HTTP 요청 처리 및 응답.
  - **Services**: `src/*/*.service.ts` - 비즈니스 로직 구현.
  - **Modules**: `src/*/*.module.ts` - 기능별 모듈 정의.
  - **DTOs**: `src/*/dto/*.dto.ts` - 데이터 전송 객체.
  - **Guards**: `src/*/guards/*.guard.ts` - 인증 및 권한 검사.
- **Python 스크립트**: `backend/scripts/` - 데이터 수집 및 분석 스크립트.
- **Config**: `src/config/*.ts` - 환경 변수 설정.

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
