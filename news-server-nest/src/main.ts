import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CORS 허용
  app.enableCors();
  // .env 파일의 PORT를 사용, 없으면 3000번 포트
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Nest.js server is running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Error starting Nest.js server:', err);
});
