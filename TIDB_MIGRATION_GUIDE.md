# TiDB 데이터 이관 가이드 (회사 → 개인)

## 개요

회사 TiDB 계정에서 개인 TiDB 계정으로 데이터베이스를 이관하는 단계별 가이드입니다.

---

## 1단계: 개인 TiDB 계정 생성

### 1. TiDB Cloud 회원가입

1. https://tidbcloud.com/ 접속
2. **개인 이메일**로 회원가입 (Gmail, Naver 등)
3. 이메일 인증 완료

### 2. Serverless Cluster 생성 (무료)

1. 로그인 후 **"Create Cluster"** 클릭
2. 클러스터 설정:
   - **Cluster Type**: Serverless (무료)
   - **Cloud Provider**: AWS
   - **Region**: `ap-northeast-1` (도쿄, 한국과 가장 가까움)
   - **Cluster Name**: `newsround1-cluster` (원하는 이름)
3. **Create** 클릭
4. 클러스터 생성 완료 (1-2분 소요)

### 3. 연결 정보 확인

1. 생성된 클러스터 클릭
2. **"Connect"** 버튼 클릭
3. **"Standard Connection"** 탭 선택
4. 연결 정보 확인 및 복사:
   ```
   Host: gateway01.ap-northeast-1.prod.aws.tidbcloud.com
   Port: 4000
   User: <your-username>
   Password: <your-password>
   ```
5. **비밀번호는 클러스터 생성 시 설정한 값** (잊어버렸다면 재설정 가능)

---

## 2단계: DBeaver 설치 및 연결 설정

### 1. DBeaver 설치 (개인 PC)

1. https://dbeaver.io/download/ 접속
2. **Community Edition** (무료) 다운로드
3. 설치 진행 (기본 설정으로 진행)

### 2. 개인 TiDB 연결 생성

1. DBeaver 실행
2. 좌측 상단 **플러그 아이콘(+)** 클릭 → **"MySQL"** 선택

#### Main 탭:

| 항목     | 값                                                |
| -------- | ------------------------------------------------- |
| Host     | `gateway01.ap-northeast-1.prod.aws.tidbcloud.com` |
| Port     | `4000`                                            |
| Database | `newsround1` (생성할 데이터베이스 이름)           |
| Username | `<개인-TiDB-유저명>`                              |
| Password | `<개인-TiDB-비밀번호>`                            |

#### SSL 탭:

- ✅ **"Use SSL"** 체크
- ❌ **"Verify server certificate"** 체크 해제

#### Driver Properties 탭:

다음 속성을 추가/수정:
| Property | Value |
|----------|-------|
| `useSSL` | `true` |
| `requireSSL` | `true` |
| `verifyServerCertificate` | `false` |
| `allowPublicKeyRetrieval` | `true` |

**속성 추가 방법**: 하단의 "**+**" 버튼 클릭 → Name/Value 입력

### 3. 연결 테스트

1. **"Test Connection"** 버튼 클릭
2. ✅ "Connected" 메시지 확인
3. **"Finish"** 클릭

---

## 3단계: 회사 노트북에서 데이터 백업

### Navicat Premium 사용 (회사 노트북)

#### 방법 A: Dump SQL File (추천)

1. Navicat에서 회사 TiDB 연결
2. 데이터베이스(`test`) 우클릭
3. **"Dump SQL File..."** 선택
4. 설정:
   - ✅ **Structure and data** (구조와 데이터)
   - ✅ **Include CREATE DATABASE**
   - ✅ **Include CREATE TABLE**
   - ✅ **Include DROP TABLE**
5. **Save as**: `C:\Users\[사용자]\Desktop\tidb_backup_20241204.sql`
6. **Start** 클릭 → 백업 완료

#### 백업 파일 개인 PC로 이동

- USB, Google Drive, OneDrive, 이메일 등 활용
- 파일 크기: 데이터 양에 따라 수십 MB ~ 수백 MB

---

## 4단계: 스키마 파일 수정

### 프로젝트의 스키마 파일 데이터베이스 이름 변경

이미 수정 완료되었습니다! `db/initdb/01-schema.sql` 파일에 다음 구문이 추가되어 있습니다:

```sql
-- Create and use newsround1 database
CREATE DATABASE IF NOT EXISTS newsround1
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE newsround1;
```

### 백업 파일 수정 (Navicat에서 받은 파일)

백업 파일 상단에 `USE newsround1;` 추가:

```sql
/*
 Navicat Premium Data Transfer
 ...
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 👇 이 줄 추가!
USE newsround1;

-- ----------------------------
-- Table structure for tn_article
-- ----------------------------
```

---

## 5단계: 데이터 복원 (개인 PC, DBeaver)

### 1. 스키마 생성 (테이블 구조)

1. DBeaver에서 개인 TiDB 연결 우클릭
2. **"SQL Editor"** → **"Open SQL Script"** 선택
3. **`c:\Users\RST\.vscode\news\db\initdb\01-schema.sql`** 선택
4. **Ctrl+Alt+X** (Execute Script) 또는 ▶ 버튼 클릭
5. 실행 완료 확인 (모든 테이블 생성됨)

### 2. 데이터 삽입 (백업 파일)

1. 동일한 방식으로 **SQL Editor** 열기
2. **백업 파일** (`tidb_backup_20241204.sql`) 선택
3. **Execute Script** 실행
4. 완료까지 대기 (데이터 양에 따라 몇 분 소요)

### 3. 복원 확인

```sql
-- 테이블 목록 확인
SHOW TABLES;

-- 데이터 개수 확인
SELECT COUNT(*) FROM tn_user;
SELECT COUNT(*) FROM tn_topic;
SELECT COUNT(*) FROM tn_article;
SELECT COUNT(*) FROM tn_chat;
```

---

## 6단계: 환경 설정 업데이트

### 1. 로컬 `.env` 파일 수정

프로젝트 루트의 `.env` 파일:

```env
# 개인 TiDB Cloud 정보로 변경
DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=<개인-TiDB-유저명>
DB_PASSWORD=<개인-TiDB-비밀번호>
DB_DATABASE=newsround1

# 나머지 환경변수는 그대로 유지
USER_JWT_SECRET=your_secret
ADMIN_JWT_SECRET=your_secret
...
```

### 2. `backend/.env` 파일도 동일하게 수정

### 3. `.env.example` 파일 업데이트 (선택사항)

---

## 7단계: Render 환경변수 업데이트

### Render 대시보드에서:

1. https://dashboard.render.com/ 로그인
2. Backend 서비스 선택
3. **"Environment"** 탭 클릭
4. 다음 변수들을 **개인 TiDB 정보**로 수정:
   ```
   DB_HOST = gateway01.ap-northeast-1.prod.aws.tidbcloud.com
   DB_PORT = 4000
   DB_USER = <개인-TiDB-유저명>
   DB_PASSWORD = <개인-TiDB-비밀번호>
   DB_DATABASE = newsround1
   ```
5. **"Save Changes"** 클릭
6. 서비스 자동 재배포 (1-2분 소요)

---

## 8단계: 연결 테스트

### 로컬 환경:

```bash
# 백엔드 서버 재시작
cd backend
npm run start:dev
```

로그에서 확인:

```
SSL enabled for DB connection without CA verification.
Database connected successfully!
```

### Render 배포 확인:

1. Render 대시보드 → **"Logs"** 탭
2. 배포 로그에서 데이터베이스 연결 성공 확인

---

## ⚠️ 문제 해결 (Troubleshooting)

### 1. SSL 연결 에러

```
Error: SSL connection required
```

**해결**: DBeaver Driver Properties에서 SSL 설정 확인

- `useSSL = true`
- `requireSSL = true`
- `verifyServerCertificate = false`

### 2. 비밀번호 에러

```
Error: Access denied for user
```

**해결**: TiDB Cloud에서 비밀번호 재설정

- Clusters → 클러스터 선택 → "Password" 탭

### 3. 외래 키 제약 에러

```
Error: Cannot add or update a child row
```

**해결**: SQL 파일 상단에 추가

```sql
SET FOREIGN_KEY_CHECKS=0;
-- (SQL 내용)
SET FOREIGN_KEY_CHECKS=1;
```

### 4. 타임존 에러

```
Error: The server time zone value
```

**해결**: DBeaver Connection URL에 추가

```
?serverTimezone=UTC
```

---

## ✅ 완료 확인 체크리스트

- [ ] 개인 TiDB 계정 생성 완료
- [ ] DBeaver 설치 및 연결 성공
- [ ] 회사 TiDB에서 백업 파일 생성
- [ ] 스키마 파일 데이터베이스 이름 변경 (`newsround1`)
- [ ] DBeaver에서 스키마 + 데이터 복원 완료
- [ ] 로컬 `.env` 파일 업데이트
- [ ] Render 환경변수 업데이트
- [ ] 로컬 서버 정상 작동 확인
- [ ] Render 배포 정상 작동 확인

---

## 📌 참고 링크

- **TiDB Cloud**: https://tidbcloud.com/
- **DBeaver 다운로드**: https://dbeaver.io/download/
- **Render 대시보드**: https://dashboard.render.com/
- **프로젝트 스키마**: `db/initdb/01-schema.sql`
