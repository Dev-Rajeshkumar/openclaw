import { Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoice.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { IAuthRequest, IApiResponse, SubscriptionPlan } from '../types/index.js';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesQuery,
  RecordPaymentInput,
} from '../validators/invoice.validator.js';

export class InvoiceController {
  /**
   * POST /api/invoices
   */
  async create(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.create(
        req.user!.userId,
        req.user!.plan as SubscriptionPlan,
        req.body as CreateInvoiceInput
      );
      sendSuccess(res, result, 'Invoice created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/invoices
   */
  async list(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const { invoices, total, page, limit } = await invoiceService.list(
        req.user!.userId,
        req.query as unknown as ListInvoicesQuery
      );
      sendPaginated(res, invoices, total, page, limit, 'Invoices fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/invoices/:id
   */
  async getById(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.getById(req.user!.userId, req.params.id);
      sendSuccess(res, result, 'Invoice fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/invoices/:id
   */
  async update(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.update(
        req.user!.userId,
        req.params.id,
        req.user!.plan as SubscriptionPlan,
        req.body as UpdateInvoiceInput
      );
      sendSuccess(res, result, 'Invoice updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/invoices/:id
   */
  async delete(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.delete(req.user!.userId, req.params.id);
      sendSuccess(res, result, 'Invoice deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/invoices/:id/payments
   */
  async recordPayment(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.recordPayment(
        req.user!.userId,
        req.params.id,
        req.body as RecordPaymentInput
      );
      sendSuccess(res, result, 'Payment recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/invoices/dashboard/stats
   */
  async getDashboardStats(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.getDashboardStats(req.user!.userId);
      sendSuccess(res, result, 'Dashboard stats fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();
