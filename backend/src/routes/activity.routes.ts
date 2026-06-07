import { Router } from 'express';
import { activityLogService } from '../services/activityLog.service.js';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

// Get current user's activity logs
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string | undefined;
    const entity = req.query.entity as string | undefined;

    const { logs, total } = await activityLogService.getByUser(userId, { page, limit, action, entity });
    sendPaginated(res, logs, total, page, limit, 'Activity logs fetched');
  } catch (error) {
    next(error);
  }
});

// Get all activity logs (debug endpoint - could be admin-only)
router.get('/all', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const { logs, total } = await activityLogService.getAll({ page, limit });
    sendPaginated(res, logs, total, page, limit, 'All activity logs fetched');
  } catch (error) {
    next(error);
  }
});

export default router;
