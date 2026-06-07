import { Response } from 'express';
import { IApiResponse } from '../types/index.js';

export const sendSuccess = <T>(
  res: Response<IApiResponse<T>>,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: IApiResponse<T>['meta']
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};

export const sendError = (
  res: Response<IApiResponse>,
  message = 'An error occurred',
  statusCode = 500,
  error?: string
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(error && { error }),
  });
};

export const sendPaginated = <T>(
  res: Response<IApiResponse<T[]>>,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): void => {
  const totalPages = Math.ceil(total / limit);
  res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  });
};
