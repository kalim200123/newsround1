# 🖥️ 개인 PC에서 프로젝트 실행하기 (최종)

## 🎯 목표

개인 PC에서 **백엔드와 프론트엔드 서버만 Docker로 실행**하고, 데이터베이스는 **운영 중인 TiDB 클라우드**에 직접 연결하여 사용합니다.

---

## 📋 사전 준비

### 1. Docker Desktop 설치

- [Windows 다운로드](https://www.docker.com/products/docker-desktop/)
- [Mac 다운로드](https://www.docker.com/products/docker-desktop/)

### 2. Git 설치

- [Windows 다운로드](https://git-scm.com/download/win)

---

## 🚀 실행 방법 (3분 완성)

### 1️⃣ 프로젝트 클론

```bash
git clone https://github.com/kalim200123/newsround1.git
cd newsround1
```

### 2️⃣ 환경 변수 설정 (`.env`)

프로젝트 루트에 `.env` 파일을 만들고 **TiDB 접속 정보**를 입력하세요.

```bash
# === TiDB 클라우드 연결 정보 (필수) ===
DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=3u5ghUwhP3xCmEX.root
DB_PASSWORD=your_actual_password  <-- 여기에 실제 비밀번호 입력!
DB_DATABASE=test

# === 관리자 계정 ===
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password

# === 보안 키 (임의의 문자열) ===
USER_JWT_SECRET=secret1
ADMIN_JWT_SECRET=secret2
INTERNAL_API_SECRET=secret3

# === 기타 ===
USE_S3=false
```

### 3️⃣ Docker 실행

```bash
# 이미지 다운로드 & 실행
docker-compose -f docker-compose.personal.yml up -d
```

### 4️⃣ 접속 확인

- **관리자 페이지**: http://localhost:5173
- **백엔드 API**: http://localhost:3002

---

## 🛑 중지 방법

```bash
docker-compose -f docker-compose.personal.yml down
```

---

## ⚠️ 주의사항

- **실제 데이터 사용**: 이 방식은 운영 중인 DB(`test` 데이터베이스)에 직접 연결됩니다.
- **데이터 삭제 주의**: 관리자 페이지에서 데이터를 삭제하면 **실제 서비스에서도 삭제**됩니다!
- **인터넷 연결 필수**: DB가 클라우드에 있으므로 인터넷이 끊기면 작동하지 않습니다.

---

## 📊 데이터베이스 접속 (DBeaver)

개인 PC에서 DB 데이터를 직접 확인하려면 DBeaver 같은 도구를 사용하세요.

### 연결 설정 방법

1. **New Connection** → **MySQL** 선택
2. **Server Host**: `gateway01.ap-northeast-1.prod.aws.tidbcloud.com`
3. **Port**: `4000`
4. **Database**: `test`
5. **Username**: `3u5ghUwhP3xCmEX.root`
6. **Password**: (회사 컴퓨터 `.env`에 있는 비밀번호)
7. **Test Connection** 클릭 후 성공하면 완료!
