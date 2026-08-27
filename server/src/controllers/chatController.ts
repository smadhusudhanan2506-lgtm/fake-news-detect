import { Request, Response, NextFunction } from 'express';
import { Conversation, IConversation, ChatMode } from '../models/Conversation';
import { OpenAiService } from '../services/openAiService';
import { AuthRequest } from '../middleware/authMiddleware';
import { memoryStore } from '../config/memoryStore';
import { isMongoConnected } from '../config/db';

export class ChatController {
  public static async sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, conversationId, mode = 'general' } = req.body;
      const userId = req.user?.userId || 'anonymous';

      if (!message || !message.trim()) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Message content is required.' },
        });
        return;
      }

      let activeConv: any = null;

      // Load existing conversation or create new
      if (conversationId) {
        if (isMongoConnected) {
          activeConv = await Conversation.findById(conversationId);
        }
        if (!activeConv) {
          activeConv = memoryStore.conversations.get(conversationId);
        }
      }

      if (!activeConv) {
        const title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
        const newConvData = {
          userId,
          title,
          mode: mode as ChatMode,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (isMongoConnected) {
          try {
            const doc = new Conversation(newConvData);
            activeConv = await doc.save();
          } catch {
            // Fallthrough
          }
        }

        if (!activeConv) {
          const genId = memoryStore.generateId();
          activeConv = { ...newConvData, _id: genId };
          memoryStore.conversations.set(genId, activeConv);
        }
      }

      // Add User Message
      const userMsg = {
        role: 'user' as const,
        content: message,
        mode: mode as ChatMode,
        timestamp: new Date(),
      };
      activeConv.messages.push(userMsg);

      // Generate AI Response
      const history = activeConv.messages.map((m: any) => ({ role: m.role, content: m.content }));
      const aiResult = await OpenAiService.generateChatResponse(message, history, mode as ChatMode);

      // Add Assistant Message
      const assistantMsg = {
        role: 'assistant' as const,
        content: aiResult.content,
        mode: mode as ChatMode,
        verdict: aiResult.verdict,
        confidence: aiResult.confidence,
        sources: aiResult.sources || [],
        timestamp: new Date(),
      };
      activeConv.messages.push(assistantMsg);
      activeConv.updatedAt = new Date();

      if (isMongoConnected && activeConv.save) {
        await activeConv.save();
      }

      res.status(200).json({
        success: true,
        conversationId: activeConv._id,
        message: assistantMsg,
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async getConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || 'anonymous';

      if (isMongoConnected) {
        try {
          const convs = await Conversation.find({ userId }).sort({ updatedAt: -1 }).select('title mode createdAt updatedAt');
          res.status(200).json({ success: true, data: { conversations: convs } });
          return;
        } catch {
          // Fallthrough
        }
      }

      const convs = Array.from(memoryStore.conversations.values())
        .filter((c) => c.userId === userId || c.userId === 'anonymous')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map((c) => ({
          _id: c._id,
          title: c.title,
          mode: c.mode,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));

      res.status(200).json({ success: true, data: { conversations: convs } });
    } catch (err: any) {
      next(err);
    }
  }

  public static async getConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const convId = String(req.params.conversationId);

      if (isMongoConnected) {
        try {
          const conv = await Conversation.findById(convId);
          if (conv) {
            res.status(200).json({ success: true, data: { conversation: conv } });
            return;
          }
        } catch {
          // Fallthrough
        }
      }

      const conv = memoryStore.conversations.get(convId);
      if (conv) {
        res.status(200).json({ success: true, data: { conversation: conv } });
        return;
      }

      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation thread not found.' },
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async deleteConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const convId = String(req.params.conversationId);

      if (isMongoConnected) {
        try {
          await Conversation.findByIdAndDelete(convId);
        } catch {
          // Fallthrough
        }
      }
      memoryStore.conversations.delete(convId);

      res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully.',
      });
    } catch (err: any) {
      next(err);
    }
  }
}
