import { Response, NextFunction } from 'express';
import { businessService } from '../services/business.service.js';
import { sendSuccess } from '../utils/response.js';
import { IAuthRequest, IApiResponse, SubscriptionPlan } from '../types/index.js';
import { CreateBusinessInput, UpdateBusinessInput } from '../validators/business.validator.js';

export class BusinessController {
  async create(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await businessService.create(req.user!.userId, req.body as CreateBusinessInput);
      sendSuccess(res, result, 'Business created successfully', 201);
    } catch (error) { next(error); }
  }

  async list(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await businessService.getByUser(req.user!.userId);
      sendSuccess(res, result, 'Businesses fetched successfully');
    } catch (error) { next(error); }
  }

  async getById(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await businessService.getById(req.user!.userId, req.params.id);
      sendSuccess(res, result, 'Business fetched successfully');
    } catch (error) { next(error); }
  }

  async update(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await businessService.update(req.user!.userId, req.params.id, req.body as UpdateBusinessInput);
      sendSuccess(res, result, 'Business updated successfully');
    } catch (error) { next(error); }
  }

  async delete(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await businessService.softDelete(req.user!.userId, req.params.id);
      sendSuccess(res, result, 'Business deleted successfully');
    } catch (error) { next(error); }
  }

  async updatePlan(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const { plan } = req.body as { plan: SubscriptionPlan };
      const result = await businessService.updatePlan(req.user!.userId, req.params.id, plan);
      sendSuccess(res, result, 'Plan updated successfully');
    } catch (error) { next(error); }
  }

  async getDefault(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await businessService.getDefault(req.user!.userId);
      sendSuccess(res, result, 'Default business fetched successfully');
    } catch (error) { next(error); }
  }
}

export const businessController = new BusinessController();
