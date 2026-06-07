import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/response.js';

type ZodSource = 'body' | 'query' | 'params' | 'headers';

export const validate = (
  schema: ZodSchema,
  source: ZodSource = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        next(new AppError('Validation failed', 400, errors));
      } else {
        next(error);
      }
    }
  };
};

export const validateMultiple = (
  schemas: Partial<Record<ZodSource, ZodSchema>>
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const allErrors: Record<string, string[]> = {};

    for (const [source, schema] of Object.entries(schemas)) {
      try {
        const data = schema.parse(req[source as ZodSource]);
        req[source as ZodSource] = data;
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach((err) => {
            const path = `${source}.${err.path.join('.')}`;
            if (!allErrors[path]) {
              allErrors[path] = [];
            }
            allErrors[path].push(err.message);
          });
        } else {
          next(error);
          return;
        }
      }
    }

    if (Object.keys(allErrors).length > 0) {
      next(new AppError('Validation failed', 400, allErrors));
      return;
    }

    next();
  };
};
