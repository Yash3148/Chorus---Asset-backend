import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // register all plugins and extension
  // app.setGlobalPrefix('api');

  app.enableCors({ origin: '*' });
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      // whitelist: true,
    }),
  );
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  await app.listen(configService.get('port'));
}
bootstrap();
