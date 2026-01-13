// ==========================================
// Health Check Routes
// ==========================================

import { Router, Request, Response } from 'express';
import { PROMPT_VERSIONS } from '@ruach/shared';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ruach-compass-api',
    version: '1.0.0',
    promptVersions: PROMPT_VERSIONS
  });
});

router.get('/ready', (req: Request, res: Response) => {
  // Check if Gemini API key is configured
  const geminiConfigured = !!process.env.GEMINI_API_KEY;

  if (!geminiConfigured) {
    return res.status(503).json({
      status: 'not_ready',
      reason: 'GEMINI_API_KEY not configured'
    });
  }

  res.json({
    status: 'ready',
    gemini: 'configured'
  });
});

export default router;
