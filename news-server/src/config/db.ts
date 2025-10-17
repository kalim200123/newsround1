import mysql from "mysql2/promise";
import fs from "fs";

// DB 커넥션 풀(Connection Pool) 생성
const config: mysql.PoolOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// For TiDB Cloud (and other SSL-required DBs), add SSL options.
if (process.env.DB_SSL_ENABLED === 'true') {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // This path is for Render's environment.
    try {
      config.ssl = { ca: fs.readFileSync('/etc/ssl/certs/ca-certificates.crt') };
    } catch (e) {
      console.error("Could not read CA certificate for production SSL connection:", e);
    }
  } else {
    // For local dev, this bypasses CA verification. Not for production use.
    config.ssl = { rejectUnauthorized: false };
    console.warn("SSL enabled for DB connection without CA verification. For development use only.");
  }
}

const pool = mysql.createPool(config);

// 생성한 커넥션 풀을 다른 파일에서 사용할 수 있도록 내보냅니다.
export default pool;