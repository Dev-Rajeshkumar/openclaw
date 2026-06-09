import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from './config/index.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { activityLogger } from './middleware/activityLogger.js';
import { sendDiscordNotification } from './services/notification.service.js';
import { processRecurringInvoices } from './jobs/recurringInvoice.job.js';
import { processEmailReminders } from './jobs/emailReminder.job.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import businessRoutes from './routes/business.routes.js';
import clientRoutes from './routes/client.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import estimateRoutes from './routes/estimate.routes.js';
import recurringInvoiceRoutes from './routes/recurringInvoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import fileRoutes from './routes/file.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import teamRoutes from './routes/team.routes.js';
import reportRoutes from './routes/report.routes.js';
import activityLogRoutes from './routes/activityLog.routes.js';
import statusLogRoutes from './routes/statusLog.routes.js';
import productRoutes from './routes/product.routes.js';
import publicInvoiceRoutes from './routes/publicInvoice.routes.js';
import razorpayPaymentRoutes from './routes/razorpayPayment.routes.js';
import clientPortalRoutes from './routes/clientPortal.routes.js';
import aiInvoiceRoutes from './routes/aiInvoice.routes.js';
import gstRoutes from './routes/gst.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import invoiceTemplateRoutes from './routes/invoiceTemplate.routes.js';

const app = express();
const API_PREFIX = `/api/${config.apiVersion}`;

// ─── Global Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Business-Id'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(generalLimiter);

// ─── Static Files ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// ─── Health Check ───────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'BillingBee API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to BillingBee API v2',
    docs: `${API_PREFIX}/health`,
  });
});

// ─── API Routes ─────────────────────────────────────────────────────
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/businesses`, businessRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/clients`, clientRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/invoices`, invoiceRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/estimates`, estimateRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/recurring`, recurringInvoiceRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/expenses`, expenseRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/files`, fileRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/products`, productRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/gst`, gstRoutes);
app.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/invoice-templates`, invoiceTemplateRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/team`, teamRoutes);
app.use(`${API_PREFIX}/activity-logs`, activityLogRoutes);
app.use(`${API_PREFIX}/status-logs`, statusLogRoutes);
app.use(`${API_PREFIX}/businesses/:businessId/reports`, reportRoutes);

// ─── Client Portal Routes ───────────────────────────────────────
app.use('/portal', clientPortalRoutes);

// ─── Public Invoice Routes (no auth) ──────────────────────────────
app.use('/public/invoices', publicInvoiceRoutes);
app.use('/public/payments', razorpayPaymentRoutes);

// ─── Activity Logger (after routes to capture all API calls) ────────
app.use(activityLogger);

// ─── Error Handling ─────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── AI Routes ──────────────────────────────────────────────────
app.use(`${API_PREFIX}/ai`, aiInvoiceRoutes);

// ─── Cron Jobs ────────────────────────────────────────────────────
// Run recurring invoice processor every hour
if (config.env !== 'test') {
  // Run recurring invoice processor every hour
  setInterval(async () => {
    try {
      const result = await processRecurringInvoices();
      if (result.processed > 0) {
        console.log(`[Cron] Processed ${result.processed} recurring invoices`);
      }
    } catch (error) {
      console.error('[Cron] Recurring invoice job failed:', error);
    }
  }, 60 * 60 * 1000); // Every hour

  // Run email reminders daily (24h * 60m * 60s * 1000ms)
  // Stagger by 5 minutes so it doesn't fire at the same time as the hourly job
  setTimeout(() => {
    processEmailReminders().catch((e) =>
      console.error('[Cron] Email reminder job failed:', e)
    );
    setInterval(async () => {
      try {
        const result = await processEmailReminders();
        if (result.sent > 0) {
          console.log(`[Cron] Sent ${result.sent} email reminders`);
        }
      } catch (error) {
        console.error('[Cron] Email reminder job failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }, 5 * 60 * 1000); // Start after 5 minutes

  // Run once on startup after 30 seconds
  setTimeout(() => {
    processRecurringInvoices().catch(console.error);
  }, 30000);
}

// ─── Start Server ───────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║   🐝 BillingBee API v2                       ║
  ║   Running on http://localhost:${config.port}        ║
  ║   Environment: ${config.env.padEnd(24)}║
  ║   API: ${API_PREFIX.padEnd(33)}║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  `);

  // Send Discord notification on startup
  if (config.discord.notificationsEnabled) {
    sendDiscordNotification({
      title: '🚀 BillingBee API Started',
      description: `Server started on port ${config.port} in ${config.env} mode`,
      color: 0x00ff00,
      fields: [
        { name: 'Port', value: `${config.port}`, inline: true },
        { name: 'Environment', value: config.env, inline: true },
        { name: 'API Version', value: config.apiVersion, inline: true },
      ],
    }).catch(() => {});
  }
});

// ─── Graceful Shutdown ──────────────────────────────────────────────
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('HTTP server closed.');

    // Send Discord notification
    if (config.discord.notificationsEnabled) {
      await sendDiscordNotification({
        title: '🔴 BillingBee API Stopped',
        description: `Server shut down (${signal})`,
        color: 0xff0000,
      }).catch(() => {});
    }

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

export default app;
