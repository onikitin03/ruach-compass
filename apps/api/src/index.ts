// ==========================================
// Ruach Compass API Server
// ==========================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalLimiter } from './middleware/rateLimit';
import aiRoutes from './routes/ai';
import healthRoutes from './routes/health';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Device-Id', 'X-Client-Version']
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));

// General rate limiting
app.use(generalLimiter);

// Request logging (simple)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    errorRu: 'Маршрут не найден'
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    errorRu: 'Внутренняя ошибка сервера'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     RUACH COMPASS API                  ║
║     Running on port ${PORT}               ║
╠════════════════════════════════════════╣
║  Endpoints:                            ║
║  - GET  /health                        ║
║  - POST /ai/quests                     ║
║  - POST /ai/script                     ║
║  - POST /ai/reset                      ║
║  - POST /ai/safety                     ║
╚════════════════════════════════════════╝
  `);

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY not set. AI features will fail.');
  }
});

export default app;
