import { Response, NextFunction } from 'express';
import * as templateService from '../services/invoiceTemplate.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const getTemplates = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const templates = await templateService.getTemplatesForUser(userId, businessId);
    res.status(200).json(ApiResponse.success(templates));
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId, slug } = req.params;
    const template = await templateService.getTemplateBySlug(slug, userId, businessId);
    res.status(200).json(ApiResponse.success(template));
  } catch (error) {
    next(error);
  }
};

export const createCustom = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const template = await templateService.createCustomTemplate(userId, businessId, req.body);
    res.status(201).json(ApiResponse.created(template, 'Custom template created'));
  } catch (error) {
    next(error);
  }
};

export const setDefault = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { businessId } = req.params;
    const { slug } = req.body;
    const result = await templateService.setDefaultTemplate(userId, businessId, slug);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const getAvailableByPlan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { Plan } = await import('../types/index.js');
    const { plan } = req.params;
    const templates = templateService.getAvailableTemplates(plan as any);
    res.status(200).json(ApiResponse.success({ plan, templates }));
  } catch (error) {
    next(error);
  }
};
