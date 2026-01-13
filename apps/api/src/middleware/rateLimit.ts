// ==========================================
// Rate Limiting Middleware
// ==========================================

import rateLimit from 'express-rate-limit';

// General API rate limit
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    errorRu: 'Слишком много запросов. Попробуй позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoint rate limit (more restrictive)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: {
    error: 'AI request limit reached. Please wait a moment.',
    errorRu: 'Лимит AI запросов. Подожди минуту.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Device-based rate limiter (using deviceId header)
const deviceRequestCounts = new Map<string, { count: number; resetTime: number }>();

export const deviceLimiter = (maxRequests: number, windowMs: number) => {
  return (req: any, res: any, next: any) => {
    const deviceId = req.headers['x-device-id'] as string;

    if (!deviceId) {
      return res.status(400).json({
        error: 'X-Device-Id header required',
        errorRu: 'Требуется заголовок X-Device-Id'
      });
    }

    const now = Date.now();
    const deviceData = deviceRequestCounts.get(deviceId);

    if (!deviceData || now > deviceData.resetTime) {
      // New window
      deviceRequestCounts.set(deviceId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (deviceData.count >= maxRequests) {
      const waitTime = Math.ceil((deviceData.resetTime - now) / 1000);
      return res.status(429).json({
        error: `Rate limit exceeded. Try again in ${waitTime} seconds.`,
        errorRu: `Лимит запросов. Попробуй через ${waitTime} сек.`,
        retryAfter: waitTime
      });
    }

    deviceData.count++;
    return next();
  };
};
