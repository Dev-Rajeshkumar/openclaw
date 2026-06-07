import { Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoice.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { IAuthRequest, IApiResponse } from '../types/index.js';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesQuery,
  RecordPaymentInput,
} from '../validators/invoice.validator.js';

export class InvoiceController {
  async create(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.create(
        req.user!.userId,
        req.businessId!,
        (req.business?.plan || 'FREE') as any,
        req.body as CreateInvoiceInput
      );
      sendSuccess(res, result, 'Invoice created successfully', 201);
    } catch (error) { next(error); }
  }

  async list(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const { invoices, total, page, limit } = await invoiceService.list(
        req.businessId!,
        req.query as unknown as ListInvoicesQuery
      );
      sendPaginated(res, invoices, total, page, limit, 'Invoices fetched successfully');
    } catch (error) { next(error); }
  }

  async getById(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.getById(req.user!.userId, req.businessId!, req.params.id);
      sendSuccess(res, result, 'Invoice fetched successfully');
    } catch (error) { next(error); }
  }

  async update(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.update(
        req.user!.userId,
        req.businessId!,
        req.params.id,
        (req.business?.plan || 'FREE') as any,
        req.body as UpdateInvoiceInput
      );
      sendSuccess(res, result, 'Invoice updated successfully');
    } catch (error) { next(error); }
  }

  async delete(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.softDelete(req.user!.userId, req.businessId!, req.params.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async recordPayment(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.recordPayment(
        req.user!.userId,
        req.businessId!,
        req.params.id,
        req.body as RecordPaymentInput
      );
      sendSuccess(res, result, 'Payment recorded successfully', 201);
    } catch (error) { next(error); }
  }

  async getDashboardStats(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await invoiceService.getDashboardStats(req.businessId!);
      sendSuccess(res, result, 'Dashboard stats fetched successfully');
    } catch (error) { next(error); }
  }
}

export const invoiceController = new InvoiceController();
