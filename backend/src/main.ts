import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const PORT = process.env.PORT || 3000;
const logger = new Logger('Bootstrap');
const HOST = process.env.HOST || `http://localhost:${PORT}`;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.DASHBOARD_ORIGIN ?? true,
    credentials: true,
  });

  await app.listen(PORT);
  logger.log(`Application is running on: ${HOST}`);
}

bootstrap();
