import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/newsService';
import { NewsCategory } from '../models/News';
import { AuthRequest } from '../middleware/authMiddleware';

export class NewsController {
  public static async getNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, search, page = '1', limit = '20', lang = 'en' } = req.query;
      const result = await NewsService.getNews({
        category: category as NewsCategory,
        search: search as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        lang: (lang as string).toLowerCase() === 'ta' ? 'ta' : 'en',
      });

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      next(err);
    }
  }

  public static async getTrending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lang = 'en' } = req.query;
      const result = await NewsService.getNews({
        trendingOnly: true,
        limit: 10,
        lang: (lang as string).toLowerCase() === 'ta' ? 'ta' : 'en',
      });

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      next(err);
    }
  }

  public static async getLocal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lang = 'en' } = req.query;
      const result = await NewsService.getNews({
        category: 'India',
        limit: 10,
        lang: (lang as string).toLowerCase() === 'ta' ? 'ta' : 'en',
      });

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      next(err);
    }
  }

  public static async getDailyBriefing(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lang = 'en' } = req.query;
      const briefing = await NewsService.getDailyBriefing(
        req.user?.role ? undefined : undefined,
        (lang as string).toLowerCase() === 'ta' ? 'ta' : 'en'
      );
      res.status(200).json({ success: true, data: { briefing } });
    } catch (err: any) {
      next(err);
    }
  }
}
