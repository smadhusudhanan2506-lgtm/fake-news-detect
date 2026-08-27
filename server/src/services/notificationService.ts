import { logger } from '../config/logger';

export interface INotificationPayload {
  userId?: string;
  title: string;
  body: string;
  type: 'daily_briefing' | 'verification_completed' | 'moderation_alert' | 'breaking_news';
  data?: Record<string, any>;
}

export class NotificationService {
  private static userTokens: Map<string, string> = new Map();

  public static registerDeviceToken(userId: string, token: string) {
    this.userTokens.set(userId, token);
    logger.info(`Device token registered for user: ${userId}`);
  }

  public static async send(payload: INotificationPayload): Promise<boolean> {
    logger.info(`[Push Notification] -> To: ${payload.userId || 'ALL'}, Type: ${payload.type}, Title: "${payload.title}"`);
    return true;
  }

  public static async sendDailyBriefing(userId: string, briefingTitle: string) {
    return this.send({
      userId,
      title: '🌅 Your FactCheck AI Daily Briefing is Ready',
      body: briefingTitle,
      type: 'daily_briefing',
    });
  }
}
