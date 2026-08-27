import { Router } from 'express';
import multer from 'multer';
import { VerifyController } from '../controllers/verifyController';
import { authenticateToken } from '../middleware/authMiddleware';
import { anonymousLimiter } from '../middleware/rateLimiterMiddleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

const router = Router();

router.use(anonymousLimiter);

router.post('/text', authenticateToken, VerifyController.verifyText);
router.post('/url', authenticateToken, VerifyController.verifyUrl);
router.post('/image', authenticateToken, upload.single('image'), VerifyController.verifyImage);
router.post('/video', authenticateToken, upload.single('video'), VerifyController.verifyVideo);
router.post('/share', authenticateToken, VerifyController.verifyShare);

router.get('/history', authenticateToken, VerifyController.getHistory);
router.get('/:analysisId', VerifyController.getAnalysis);
router.delete('/history/:id', authenticateToken, VerifyController.deleteHistory);

export default router;
