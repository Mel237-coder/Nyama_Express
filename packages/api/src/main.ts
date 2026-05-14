import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3001);
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS', 'http://localhost:3002,http://localhost:3000').split(',');

  // Activation CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Prefix API
  app.setGlobalPrefix('api');

  // Root health check (outside /api prefix)
  const expressApp: any = app.getHttpAdapter().getInstance();
  expressApp.get('/', (req: any, res: any) => {
    res.json({ status: 'ok', service: 'FoodApp API', timestamp: new Date().toISOString() });
  });

  await app.listen(port);
  console.log(`🎯 FoodApp API running on http://localhost:${port}`);
}
bootstrap();