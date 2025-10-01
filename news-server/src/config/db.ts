import dotenv from "dotenv";
import mysql from "mysql2/promise";
import path from "path";

// .env 파일의 절대 경로를 계산하여 환경 변수를 로드합니다.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

// DB 커넥션 풀(Connection Pool) 생성
// 웹 서버처럼 여러 요청을 동시에 처리해야 하는 경우,
// 매번 연결을 새로 만드는 대신 '커넥션 풀'을 만들어두고 재사용하는 것이 훨씬 효율적입니다.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 생성한 커넥션 풀을 다른 파일에서 사용할 수 있도록 내보냅니다.
export default pool;
