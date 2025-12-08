import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as mysql from 'mysql2/promise';
import { DB_CONNECTION_POOL } from './database.constants';

const dbProvider = {
  provide: DB_CONNECTION_POOL,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const config: mysql.PoolOptions = {
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT'),
      user: configService.get<string>('DB_USER'),
      password: configService.get<string>('DB_PASSWORD'),
      database: configService.get<string>('DB_DATABASE'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    };

    if (configService.get<string>('DB_SSL_ENABLED') === 'true') {
      const isProduction =
        configService.get<string>('NODE_ENV') === 'production';
      if (isProduction) {
        try {
          // Render와 같은 프로덕션 환경
          config.ssl = {
            ca: fs.readFileSync('/etc/ssl/certs/ca-certificates.crt'),
          };
        } catch (e) {
          console.error(
            'Could not read CA certificate for production SSL connection:',
            e,
          );
        }
      } else {
        // 로컬 개발 환경 (인증서 검증 안 함)
        config.ssl = { rejectUnauthorized: false };
        console.warn(
          'SSL enabled for DB connection without CA verification. For development use only.',
        );
      }
    }

    return mysql.createPool(config);
  },
};

@Module({
  imports: [ConfigModule],
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DatabaseModule {}
