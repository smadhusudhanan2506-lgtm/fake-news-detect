import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticateToken, ChatController.sendMessage);
router.get('/conversations', authenticateToken, ChatController.getConversations);
router.get('/:conversationId', authenticateToken, ChatController.getConversation);
router.delete('/:conversationId', authenticateToken, ChatController.deleteConversation);

export default router;
