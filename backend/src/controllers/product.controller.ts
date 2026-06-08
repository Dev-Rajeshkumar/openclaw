import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

const prisma = new PrismaClient();

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const businessId = req.headers['x-business-id'] as string;
    const { name, sku, hsnCode, description, unitPrice, taxRate, category } = req.body;

    const product = await prisma.product.create({
      data: {
        userId,
        businessId,
        name,
        sku: sku || null,
        hsnCode: hsnCode || null,
        description: description || null,
        unitPrice: parseFloat(unitPrice) || 0,
        taxRate: parseFloat(taxRate) || 0,
        category: category || null,
      },
    });

    res.status(201).json(ApiResponse.created(product, 'Product created successfully'));
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
    const businessId = req.headers['x-business-id'] as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;

    const where: any = {
      userId,
      businessId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.status(200).json(ApiResponse.paginated(products, page, limit, total));
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

    const product = await prisma.product.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!product) {
      return res.status(404).json(ApiResponse.error('Product not found', 404));
    }

    res.status(200).json(ApiResponse.success(product));
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

    const product = await prisma.product.updateMany({
      where: { id, userId, deletedAt: null },
      data: {
        ...req.body,
        ...(req.body.unitPrice !== undefined && { unitPrice: parseFloat(req.body.unitPrice) }),
        ...(req.body.taxRate !== undefined && { taxRate: parseFloat(req.body.taxRate) }),
      },
    });

    if (product.count === 0) {
      return res.status(404).json(ApiResponse.error('Product not found', 404));
    }

    const updated = await prisma.product.findUnique({ where: { id } });
    res.status(200).json(ApiResponse.success(updated, 'Product updated successfully'));
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

    const result = await prisma.product.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      return res.status(404).json(ApiResponse.error('Product not found', 404));
    }

    res.status(200).json(ApiResponse.success({ id }, 'Product deleted successfully'));
  } catch (error) {
    next(error);
  }
};
