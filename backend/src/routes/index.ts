import { Router } from 'express';
import authRoutes from './auth.routes.js';
import businessRoutes from './business.routes.js';
import clientRoutes from './client.routes.js';
import invoiceRoutes from './invoice.routes.js';
import userRoutes from './user.routes.js';
import activityRoutes from './activity.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/businesses', businessRoutes);
router.use('/clients', clientRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/users', userRoutes);
router.use('/activity', activityRoutes);

export default router;
