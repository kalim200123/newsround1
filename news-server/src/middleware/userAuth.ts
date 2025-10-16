
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request interface to include the user property
export interface AuthenticatedRequest extends Request {
  user?: { userId: number; username: string };
}

export const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.USER_JWT_SECRET || "default_fallback_secret";
    if (jwtSecret === 'default_fallback_secret') {
        console.warn('Warning: USER_JWT_SECRET environment variable is not set. Using a default secret key for development.');
    }
    const decoded = jwt.verify(token, jwtSecret) as { userId: number; username: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};
