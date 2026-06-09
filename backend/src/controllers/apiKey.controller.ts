import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../prisma/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const list = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;

    const keys = await prisma.apiKey.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyHash: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    // Return masked key: first 8 chars of hash + "..."
    const masked = keys.map((k) => ({
      id: k.id,
      name: k.name,
      key: k.keyHash.substring(0, 8) + '...',
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));

    res.status(200).json(ApiResponse.success(masked));
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json(ApiResponse.error('Name is required', 400));
      return;
    }

    // Generate a random 48-char hex key with bbk_ prefix
    const rawKey = 'bbk_' + crypto.randomBytes(24).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name: name.trim(),
        keyHash,
      },
    });

    res.status(201).json(
      ApiResponse.created({
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey,
        createdAt: apiKey.createdAt,
      }, 'API key created. Copy it now — it won\'t be shown again.')
    );
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

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!apiKey) {
      res.status(404).json(ApiResponse.error('API key not found', 404));
      return;
    }

    await prisma.apiKey.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json(ApiResponse.success({ id }, 'API key deleted'));
  } catch (error) {
    next(error);
  }
};
