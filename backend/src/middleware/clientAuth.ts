/**
 * Authentication middleware for client portal.
 * Validates JWT and attaches client info to request.
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

interface ClientPayload {
  userId: string;  // actually client id
  businessId: string;
  role: string;
}

export function clientAuth(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as ClientPayload;

    if (decoded.role !== 'client') {
      res.status(403).json({ success: false, message: 'Client access only' });
      return;
    }

    req.client = {
      id: decoded.userId,
      businessId: decoded.businessId,
    };

    next();
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Session expired' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }
}
