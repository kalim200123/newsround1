import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { CommentsModule } from './comments/comments.module';
import { DatabaseModule } from './database/database.module';
import { InquiryModule } from './inquiry/inquiry.module';
import { JobsModule } from './jobs/jobs.module';
import { KeywordsModule } from './keywords/keywords.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SavedModule } from './saved/saved.module';
import { TopicsModule } from './topics/topics.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    TopicsModule,
    ArticlesModule,
    CommentsModule,
    InquiryModule,
    NotificationsModule,
    SavedModule,
    JobsModule,
    ChatModule,
    AdminModule,
    KeywordsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
