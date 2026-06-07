import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// ==================== GLOBAL MIDDLEWARE ====================

// Security
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
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
  });
}

export default app;
