import { Router } from 'express';
import authRoutes from './authRoutes';
import verifyRoutes from './verifyRoutes';
import chatRoutes from './chatRoutes';
import newsRoutes from './newsRoutes';
import moderationRoutes from './moderationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/verify', verifyRoutes);
router.use('/chat', chatRoutes);
router.use('/news', newsRoutes);
router.use('/moderation', moderationRoutes);

export default router;
