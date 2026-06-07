import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { requestIdMiddleware } from './middleware/activityLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { notificationService } from './services/notification.service.js';

const app = express();

// ==================== GLOBAL MIDDLEWARE ====================

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestIdMiddleware);

if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// ==================== HEALTH CHECK ====================

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'BillingBee API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ==================== API ROUTES ====================

app.use('/api', routes);

// ==================== ERROR HANDLING ====================

app.use(notFoundHandler);
app.use(errorHandler);

// ==================== START SERVER ====================

if (config.nodeEnv !== 'test') {
  app.listen(config.port, () => {
    console.log(`
    🐝 BillingBee API Server
    ==========================
    Environment: ${config.nodeEnv}
    Port: ${config.port}
    URL: http://localhost:${config.port}
    API: http://localhost:${config.port}/api
    Health: http://localhost:${config.port}/health
    ==========================
    `);

    // Send startup notification
    notificationService.send({
      title: 'BillingBee Server Started',
      message: `Server is running in ${config.nodeEnv} mode on port ${config.port}`,
      severity: 'info',
      timestamp: new Date().toISOString(),
    }).catch(() => {});
  });
}

export default app;
