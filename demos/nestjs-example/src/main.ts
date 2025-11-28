import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use Railway's PORT if available, otherwise default to 3000 for local dev
  const port = parseInt(process.env.PORT || '3000', 10);

  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();
