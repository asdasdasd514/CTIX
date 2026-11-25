import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { apiRouter } from './routes';

const app = express();

// Cho phép CORS từ Frontend (localhost + Vercel production)
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CTIX — Trấn Biên SmartCity API',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Error handler (including Multer file size/type errors)
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[Server Error]:', err.message);
    res.status(400).json({ message: err.message || 'Đã có lỗi xảy ra trên máy chủ.' });
  }
);

async function bootstrap() {
  try {
    await connectDatabase();
    app.listen(env.PORT, () => {
      console.log(`[Server] CTIX Backend API running at http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error('[Bootstrap] Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
