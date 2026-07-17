import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  req.userId = session.user.id;
  next();
};
