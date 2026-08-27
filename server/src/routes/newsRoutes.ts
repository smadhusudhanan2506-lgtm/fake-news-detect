import { Router } from 'express';
import { NewsController } from '../controllers/newsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', NewsController.getNews);
router.get('/trending', NewsController.getTrending);
router.get('/local', authenticateToken, NewsController.getLocal);
router.get('/daily-briefing', authenticateToken, NewsController.getDailyBriefing);

export default router;
