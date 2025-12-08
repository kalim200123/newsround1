import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { OptionalJwtAuthGuard } from './optional-jwt.guard';
import { WsAuthGuard } from './ws.guard';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>('USER_JWT_SECRET') ||
          configService.get<string>('ADMIN_JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT secret key is not defined in environment variables.',
          );
        }
        const rawExpiresIn =
          configService.get<string>('USER_JWT_EXPIRES_IN') ||
          configService.get<string>('ADMIN_JWT_EXPIRES_IN') ||
          '12h';

        const expiresIn: SignOptions['expiresIn'] = /^\d+$/.test(rawExpiresIn)
          ? Number(rawExpiresIn)
          : (rawExpiresIn as SignOptions['expiresIn']);
        return {
          secret: secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OptionalJwtAuthGuard, WsAuthGuard],
  exports: [AuthService, OptionalJwtAuthGuard, WsAuthGuard, PassportModule],
})
export class AuthModule {}
