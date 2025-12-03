# 코드 컨벤션 (Code Conventions)

이 문서는 프로젝트의 코딩 스타일과 규칙을 정의합니다.

---

## 📁 파일 및 폴더 구조

### 모듈 구조

각 기능은 별도의 모듈 폴더로 분리합니다:

```
src/
├── auth/              # 인증
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/    # JWT, Local 전략
│   └── guards/        # 가드
├── topics/            # 토픽
│   ├── topics.module.ts
│   ├── topics.controller.ts
│   ├── topics.service.ts
│   └── dto/           # Data Transfer Objects
└── ...
```

### 파일 네이밍

- **컨트롤러**: `*.controller.ts` (예: `auth.controller.ts`)
- **서비스**: `*.service.ts` (예: `auth.service.ts`)
- **모듈**: `*.module.ts` (예: `auth.module.ts`)
- **DTO**: `*.dto.ts` (예: `login.dto.ts`)
- **가드**: `*.guard.ts` (예: `jwt-auth.guard.ts`)

---

## 🎯 네이밍 규칙

### 변수 및 함수

- **camelCase** 사용:

```typescript
const userName = 'John';
function getUserProfile() { ... }
```

### 클래스 및 인터페이스

- **PascalCase** 사용:

```typescript
class AuthService { ... }
interface LoginDto { ... }
```

### 상수

- **UPPER_SNAKE_CASE** 사용:

```typescript
const MAX_LOGIN_ATTEMPTS = 5;
const DB_CONNECTION_POOL = "DB_CONNECTION_POOL";
```

### 데이터베이스

- **테이블**: `tn_` 접두사 + 소문자 snake_case (예: `tn_user`, `tn_topic`)
- **컬럼**: 소문자 snake_case (예: `user_id`, `created_at`)

---

## 🔤 TypeScript 규칙

### 타입 명시

항상 타입을 명시합니다:

```typescript
// ❌ 나쁨
function getUser(id) {
  return db.query("SELECT * FROM tn_user WHERE id = ?", [id]);
}

// ✅ 좋음
async function getUser(id: number): Promise<User> {
  const [rows]: any = await db.query("SELECT * FROM tn_user WHERE id = ?", [id]);
  return rows[0];
}
```

### Interface vs Type

- **Interface**: 확장 가능한 객체 구조에 사용.
- **Type**: Union, Intersection, Primitive 타입에 사용.

```typescript
// Interface
interface User {
  id: number;
  email: string;
}

// Type
type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
```

---

## 🎨 코드 스타일

### 들여쓰기

- **2 스페이스** 사용 (탭 아님).

### 따옴표

- **싱글 쿼트 (`'`)** 사용:

```typescript
const message = "Hello, World!";
```

### 세미콜론

- 항상 세미콜론(`;`) 사용:

```typescript
const x = 10;
const y = 20;
```

### 줄 길이

- 최대 **100자** 권장.
- 긴 문자열은 템플릿 리터럴 또는 줄바꿈:

```typescript
const longMessage = `
  이것은 매우 긴 메시지입니다.
  여러 줄로 나누어 작성합니다.
`;
```

---

## 🛠️ NestJS 패턴

### 의존성 주입

생성자를 통한 주입:

```typescript
@Injectable()
export class TopicsService {
  constructor(
    @Inject(DB_CONNECTION_POOL) private readonly dbPool: Pool,
    private readonly notificationsService: NotificationsService
  ) {}
}
```

### DTO 사용

컨트롤러에서 요청 데이터 검증:

```typescript
// dto/create-topic.dto.ts
export class CreateTopicDto {
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  summary: string;
}

// topics.controller.ts
@Post()
async create(@Body() dto: CreateTopicDto) {
  return this.topicsService.create(dto);
}
```

### 에러 핸들링

NestJS 예외 사용:

```typescript
// ❌ 나쁨
if (!user) {
  throw new Error("User not found");
}

// ✅ 좋음
if (!user) {
  throw new NotFoundException("사용자를 찾을 수 없습니다.");
}
```

---

## 🗄️ 데이터베이스 규칙

### SQL 쿼리

- **Prepared Statements** 사용 (SQL Injection 방지):

```typescript
// ❌ 나쁨
const query = `SELECT * FROM tn_user WHERE email = '${email}'`;

// ✅ 좋음
const [rows]: any = await db.query("SELECT * FROM tn_user WHERE email = ?", [email]);
```

### 트랜잭션

데이터 무결성이 중요한 작업에는 트랜잭션 사용:

```typescript
const connection = await this.dbPool.getConnection();
try {
  await connection.beginTransaction();

  // 여러 쿼리 실행
  await connection.query("INSERT INTO ...");
  await connection.query("UPDATE ...");

  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

---

## 📝 주석 규칙

### JSDoc 주석

공개 메서드와 복잡한 로직에 JSDoc 사용:

```typescript
/**
 * 사용자 투표를 처리합니다.
 * @param topicId 토픽 ID
 * @param userId 사용자 ID
 * @param side 투표 진영 ('LEFT' | 'RIGHT')
 * @returns 투표 결과
 */
async vote(topicId: number, userId: number, side: VoteSide): Promise<VoteResult> {
  // ...
}
```

### 인라인 주석

복잡한 로직이나 주의사항에만 사용:

```typescript
// NOTE: 이 쿼리는 성능 최적화를 위해 인덱스를 사용합니다.
const [rows] = await db.query("SELECT ... WHERE ...");
```

### TODO 주석

나중에 개선할 부분 표시:

```typescript
// TODO: 캐싱 구현으로 성능 개선
```

---

## 🧪 테스트 규칙

### 테스트 파일 네이밍

- `*.spec.ts` (예: `auth.service.spec.ts`)

### 테스트 구조

```typescript
describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    // 초기화
  });

  describe("login", () => {
    it("should return JWT token on valid credentials", async () => {
      // Arrange
      const loginDto = { email: "test@example.com", password: "password" };

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty("access_token");
    });
  });
});
```

---

## ✅ 코드 리뷰 체크리스트

코드 리뷰 시 다음 항목을 확인:

- [ ] 타입이 명시되어 있는가?
- [ ] SQL Injection 취약점이 없는가?
- [ ] 에러 핸들링이 적절한가?
- [ ] 트랜잭션이 필요한 경우 사용했는가?
- [ ] 민감한 정보(비밀번호, 토큰)가 로그에 출력되지 않는가?
- [ ] 주석이 명확한가?
- [ ] 테스트가 작성되어 있는가?

---

## 🚫 금지 사항

### 절대 하지 말 것

1.  **하드코딩된 시크릿**:

```typescript
// ❌ 절대 금지!
const secret = "my_secret_key";
```

2.  **console.log 남용**:

```typescript
// ❌ 프로덕션 코드에 console.log
console.log("User data:", user);

// ✅ Logger 사용
this.logger.log("User data:", user);
```

3.  **동기 함수 사용** (Node.js에서):

```typescript
// ❌ 나쁨
const data = fs.readFileSync("file.txt");

// ✅ 좋음
const data = await fs.promises.readFile("file.txt");
```

---

## 📚 추가 참고 자료

1.  **NestJS 공식 문서**: https://docs.nestjs.com/
2.  **TypeScript 핸드북**: https://www.typescriptlang.org/docs/
3.  **Airbnb JavaScript Style Guide**: https://github.com/airbnb/javascript
4.  **Google TypeScript Style Guide**: https://google.github.io/styleguide/tsguide.html
