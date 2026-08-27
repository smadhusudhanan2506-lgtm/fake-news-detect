import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken, requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/profile', requireAuth, AuthController.updateProfile);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/logout', AuthController.logout);
router.post('/demo-switch', AuthController.demoSwitchRole);

export default router;
