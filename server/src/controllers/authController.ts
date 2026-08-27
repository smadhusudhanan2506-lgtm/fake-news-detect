import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../middleware/authMiddleware';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, phone, password, role } = req.body;
      if (!name || !email) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Name and email are required.' },
        });
        return;
      }

      const result = await AuthService.register({ name, email, phone, password, role });
      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'REGISTRATION_FAILED', message: err.message },
      });
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Email is required.' },
        });
        return;
      }

      const result = await AuthService.login(email, password);
      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: result,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: err.message },
      });
    }
  }

  public static async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'No active session.' },
        });
        return;
      }

      const user = await AuthService.findById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User profile not found.' },
        });
        return;
      }

      const userSafe = { ...user };
      delete userSafe.password;

      res.status(200).json({
        success: true,
        data: { user: userSafe },
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
      }

      const updated = await AuthService.updateProfile(req.user.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: { user: updated },
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    res.status(200).json({
      success: true,
      message: `Password reset instructions sent to ${email || 'your email'}.`,
    });
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  public static async demoSwitchRole(req: Request, res: Response): Promise<void> {
    const { role = 'moderator', name = 'Demo Moderator', email = 'moderator@factcheck.ai' } = req.body;
    const token = AuthService.generateToken({ id: 'demo_' + role, email, role, name });
    res.status(200).json({
      success: true,
      data: {
        token,
        user: { _id: 'demo_' + role, email, role, name },
      },
    });
  }
}
