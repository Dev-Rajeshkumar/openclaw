import { Request, Response, NextFunction } from 'express';
import { clientService } from '../services/client.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { IAuthRequest, IApiResponse, SubscriptionPlan } from '../types/index.js';
import { CreateClientInput, UpdateClientInput, ListClientsQuery } from '../validators/client.validator.js';

export class ClientController {
  /**
   * POST /api/clients
   */
  async create(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await clientService.create(
        req.user!.userId,
        req.user!.plan as SubscriptionPlan,
        req.body as CreateClientInput
      );
      sendSuccess(res, result, 'Client created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clients
   */
  async list(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const { clients, total, page, limit } = await clientService.list(
        req.user!.userId,
        req.query as unknown as ListClientsQuery
      );
      sendPaginated(res, clients, total, page, limit, 'Clients fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clients/:id
   */
  async getById(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await clientService.getById(req.user!.userId, req.params.id);
      sendSuccess(res, result, 'Client fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/clients/:id
   */
  async update(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await clientService.update(
        req.user!.userId,
        req.params.id,
        req.body as UpdateClientInput
      );
      sendSuccess(res, result, 'Client updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/clients/:id
   */
  async delete(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await clientService.delete(req.user!.userId, req.params.id);
      sendSuccess(res, result, 'Client deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const clientController = new ClientController();
