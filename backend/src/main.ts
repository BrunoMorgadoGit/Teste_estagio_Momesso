import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

interface ExpressSettingsHost {
  disable(setting: string): void;
  set(setting: string, value: number): void;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app
    .getHttpAdapter()
    .getInstance() as unknown as ExpressSettingsHost;

  expressApp.disable('x-powered-by');
  expressApp.set('trust proxy', 1);

  app.use(helmet());
  app.enableCors({
    origin:
      process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ??
      false,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
