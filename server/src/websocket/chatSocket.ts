import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthService } from '../services/authService';
import { OpenAiService } from '../services/openAiService';
import { Conversation, ChatMode } from '../models/Conversation';
import { memoryStore } from '../config/memoryStore';
import { isMongoConnected } from '../config/db';
import { logger } from '../config/logger';

export const setupChatWebSocket = (io: SocketIOServer) => {
  const chatNamespace = io.of('/ws/chat');

  chatNamespace.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);
    let authenticatedUser: any = null;

    // 1. Authenticate Event
    socket.on('authenticate', (data: { token?: string }) => {
      if (data?.token) {
        const payload = AuthService.verifyToken(data.token);
        if (payload) {
          authenticatedUser = payload;
          socket.emit('authenticated', { success: true, user: payload });
          logger.info(`Socket ${socket.id} authenticated as ${payload.email}`);
          return;
        }
      }
      authenticatedUser = { userId: 'anonymous', role: 'user', name: 'Anonymous' };
      socket.emit('authenticated', { success: true, user: authenticatedUser });
    });

    // 2. Real-time Chat Streaming Message
    socket.on(
      'message',
      async (data: {
        message: string;
        conversationId?: string;
        mode?: 'general' | 'news' | 'verification';
      }) => {
        try {
          const { message, conversationId, mode = 'general' } = data;
          if (!message || !message.trim()) {
            socket.emit('error', { code: 'INVALID_INPUT', message: 'Message content is required.' });
            return;
          }

          const userId = authenticatedUser?.userId || 'anonymous';

          // Emit typing indicator
          socket.emit('typing', { isTyping: true });

          let activeConv: any = null;
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
            const newConv = {
              userId,
              title,
              mode: mode as ChatMode,
              messages: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            if (isMongoConnected) {
              try {
                const doc = new Conversation(newConv);
                activeConv = await doc.save();
              } catch {
                // Fallthrough
              }
            }

            if (!activeConv) {
              const genId = memoryStore.generateId();
              activeConv = { ...newConv, _id: genId };
              memoryStore.conversations.set(genId, activeConv);
            }
          }

          // Append user message
          activeConv.messages.push({
            role: 'user',
            content: message,
            mode: mode as ChatMode,
            timestamp: new Date(),
          });

          // Generate response
          const history = activeConv.messages.map((m: any) => ({ role: m.role, content: m.content }));
          const aiResult = await OpenAiService.generateChatResponse(message, history, mode as ChatMode);

          // Stream chunks to client for realistic live feel
          const fullContent = aiResult.content;
          const words = fullContent.split(' ');
          let streamedSoFar = '';

          for (let i = 0; i < words.length; i += 6) {
            const chunk = words.slice(i, i + 6).join(' ') + ' ';
            streamedSoFar += chunk;
            socket.emit('response_chunk', {
              chunk,
              fullContent: streamedSoFar,
              conversationId: activeConv._id,
            });
            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          // Complete event
          const assistantMsg = {
            role: 'assistant',
            content: fullContent,
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

          socket.emit('typing', { isTyping: false });
          socket.emit('response_complete', {
            conversationId: activeConv._id,
            message: assistantMsg,
          });
        } catch (err: any) {
          logger.error(`WebSocket chat error: ${err.message}`);
          socket.emit('typing', { isTyping: false });
          socket.emit('error', { code: 'CHAT_ERROR', message: 'Failed to process message.' });
        }
      }
    );

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });
};
