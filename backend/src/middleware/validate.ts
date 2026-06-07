import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { IApiResponse } from '../types/index.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response<IApiResponse>, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: JSON.stringify(errors),
      });
      return;
    }

    // Attach validated data to request
    req.validatedData = result.data;
    next();
  };
};

// Extend Express Request to include validated data
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validatedData?: Record<string, unknown>;
    }
  }
}
