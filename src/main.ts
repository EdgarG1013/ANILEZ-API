import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

let app: NestExpressApplication;

async function createApp(): Promise<NestExpressApplication> {
  if (!app) {
    app = await NestFactory.create<NestExpressApplication>(AppModule);

    // CORS — orígenes permitidos
    const allowedOrigins = [
      process.env.FRONTEND_URL,       // dominio propio (anilez.site)
      'https://anilez.site',          // fallback explícito
      'http://localhost:5173',        // Vite dev
      'http://localhost:3000',
      'http://anilez.vercel.app',        // alternativo
    ].filter(Boolean) as string[];

    app.enableCors({
      origin: (origin, callback) => {
        // Permitir requests sin origin (Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Total-Count'],
      maxAge: 86400,
    });

    // Validación global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Prefijo global
    app.setGlobalPrefix('api');
  }
  return app;
}

// ─── Handler para Vercel Serverless ──────────────────────────────────────────
export default async function handler(req: any, res: any) {
  const nestApp = await createApp();
  const expressApp = nestApp.getHttpAdapter().getInstance();

  return new Promise<void>((resolve, reject) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', reject);
    expressApp(req, res);
  });
}
// ─── Desarrollo local ───────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  createApp().then((nestApp) =>
    nestApp.listen(process.env.PORT ?? 8000),
  );
}
