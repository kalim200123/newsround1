# News Project

이 프로젝트는 뉴스 기사를 수집하고, 주제별로 분류하여 보여주는 웹 애플리케이션입니다.

## 실행 방법

### 사전 요구사항

- [Docker](https://www.docker.com/products/docker-desktop/)가 설치되어 있어야 합니다.
- [Node.js](https://nodejs.org/)가 설치되어 있어야 합니다.

### 1. 데이터베이스 실행

프로젝트의 `db` 폴더로 이동하여 Docker Compose를 실행합니다. 이 명령은 백그라운드에서 MySQL 데이터베이스 컨테이너를 시작합니다.

```bash
cd db
docker-compose up -d
```

### 2. 환경 변수 설정

프로젝트의 최상위 폴더로 돌아와서, `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다. 이 파일은 애플리케이션이 데이터베이스에 연결하는 데 필요한 정보를 담고 있습니다.

```bash
# (루트 폴더에서 실행)
copy .env.example .env
```

### 3. 백엔드 서버 실행

`news-server` 폴더로 이동하여 필요한 패키지를 설치하고 서버를 시작합니다.

```bash
cd news-server
npm install
npm start
```

### 4. 프론트엔드 서버 실행

별도의 터미널을 열고 `news-ui` 폴더로 이동하여 필요한 패키지를 설치하고 개발 서버를 시작합니다.

```bash
cd news-ui
npm install
npm run dev
```

이제 웹 브라우저에서 프론트엔드 애플리케이션에 접속할 수 있습니다.
