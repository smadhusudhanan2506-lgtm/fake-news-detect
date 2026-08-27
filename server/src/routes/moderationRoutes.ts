import { Router } from 'express';
import { ModerationController } from '../controllers/moderationController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

// Any authenticated user can submit a report
router.post('/report', requireAuth, ModerationController.submitReport);

// Moderator & Admin only routes
router.get('/stats', requireAuth, requireRole(['moderator', 'admin']), ModerationController.getStats);
router.get('/queue', requireAuth, requireRole(['moderator', 'admin']), ModerationController.getQueue);
router.get('/sources', requireAuth, requireRole(['moderator', 'admin']), ModerationController.getSources);
router.post('/sources', requireAuth, requireRole(['admin']), ModerationController.updateSource);

router.post('/:id/review', requireAuth, requireRole(['moderator', 'admin']), ModerationController.reviewItem);
router.post('/:id/approve', requireAuth, requireRole(['moderator', 'admin']), ModerationController.approveItem);
router.post('/:id/reject', requireAuth, requireRole(['moderator', 'admin']), ModerationController.rejectItem);

export default router;
