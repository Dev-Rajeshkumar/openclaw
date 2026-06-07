import { Response, NextFunction } from 'express';
import * as fileService from '../services/file.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const upload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json(ApiResponse.error('No file uploaded', 400));
      return;
    }

    const uploadedFile = await fileService.uploadFile(userId, businessId, {
      entityType: req.body.entityType || 'general',
      entityId: req.body.entityId || 'general',
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    });

    res.status(201).json(ApiResponse.created(uploadedFile, 'File uploaded successfully'));
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
    const entityType = req.query.entityType as string;
    const entityId = req.query.entityId as string;

    const files = await fileService.getFiles(userId, businessId, entityType, entityId);
    res.status(200).json(ApiResponse.success(files));
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
    const file = await fileService.getFileById(id, userId);
    res.status(200).json(ApiResponse.success(file));
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
    const result = await fileService.deleteFile(id, userId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};
