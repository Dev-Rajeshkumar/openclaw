import { Response, NextFunction } from 'express';
import prisma from '../prisma/index.js';
import * as clientService from '../services/client.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const client = await clientService.createClient(userId, businessId, req.body);
    res.status(201).json(ApiResponse.created(client, 'Client created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getAll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const result = await clientService.getClients(
      userId,
      businessId,
      page,
      limit,
      search,
      status
    );
    res.status(200).json(ApiResponse.paginated(
      result.clients,
      result.page,
      result.limit,
      result.total
    ));
  } catch (error) {
    next(error);
  }
};

export const getById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const client = await clientService.getClientById(id, userId);
    res.status(200).json(ApiResponse.success(client));
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const client = await clientService.updateClient(id, userId, req.body);
    res.status(200).json(ApiResponse.success(client, 'Client updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const invoices = await prisma.invoice.findMany({
      where: { clientId: id, userId, deletedAt: null },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(ApiResponse.success(invoices));
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const result = await clientService.deleteClient(id, userId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};
