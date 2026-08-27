import { Request, Response, NextFunction } from 'express';
import { AuthService, ITokenPayload } from '../services/authService';

export interface AuthRequest extends Request {
  user?: ITokenPayload;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = undefined;
    return next();
  }

  const payload = AuthService.verifyToken(token);
  if (payload) {
    req.user = payload;
  }
  next();
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required to access this resource.',
      },
    });
    return;
  }

  const payload = AuthService.verifyToken(token);
  if (!payload) {
    res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired session token.',
      },
    });
    return;
  }

  req.user = payload;
  next();
};
