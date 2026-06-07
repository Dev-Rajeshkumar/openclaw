import { Response, NextFunction } from 'express';
import { clientService } from '../services/client.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { IAuthRequest, IApiResponse } from '../types/index.js';
import { CreateClientInput, UpdateClientInput, ListClientsQuery } from '../validators/client.validator.js';

export class ClientController {
  async create(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await clientService.create(
        req.user!.userId,
        req.businessId!,
        (req.business?.plan || 'FREE') as any,
        req.body as CreateClientInput
      );
      sendSuccess(res, result, 'Client created successfully', 201);
    } catch (error) { next(error); }
  }

  async list(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const { clients, total, page, limit } = await clientService.list(
        req.businessId!,
        req.query as unknown as ListClientsQuery
      );
      sendPaginated(res, clients, total, page, limit, 'Clients fetched successfully');
    } catch (error) { next(error); }
  }

  async getById(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await clientService.getById(req.user!.userId, req.businessId!, req.params.id);
      sendSuccess(res, result, 'Client fetched successfully');
    } catch (error) { next(error); }
  }

  async update(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await clientService.update(
        req.user!.userId,
        req.businessId!,
        req.params.id,
        req.body as UpdateClientInput
      );
      sendSuccess(res, result, 'Client updated successfully');
    } catch (error) { next(error); }
  }

  async delete(req: IAuthRequest, res: Response<IApiResponse>, next: NextFunction) {
    try {
      const result = await clientService.softDelete(req.user!.userId, req.businessId!, req.params.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }
}

export const clientController = new ClientController();
