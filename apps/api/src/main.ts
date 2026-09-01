import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { API_DEFAULT_PORT, APP_NAME } from '@sitera/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for React Web and React Native
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix for API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || API_DEFAULT_PORT;
  await app.listen(port);
  console.log(`🚀 ${APP_NAME} API is running on: http://localhost:${port}/api`);
}
bootstrap();
