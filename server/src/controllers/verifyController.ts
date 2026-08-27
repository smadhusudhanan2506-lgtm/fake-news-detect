import { Request, Response, NextFunction } from 'express';
import { VerificationPipeline } from '../services/verificationPipeline';
import { AuthRequest } from '../middleware/authMiddleware';
import { Analysis } from '../models/Analysis';
import { memoryStore } from '../config/memoryStore';
import { isMongoConnected } from '../config/db';

export class VerifyController {
  public static async verifyText(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, inputType = 'text', skipCache = false } = req.body;
      if (!text || text.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Text content is required for verification.' },
        });
        return;
      }

      const allowedTypes = ['text', 'whatsapp', 'url', 'screenshot', 'image', 'video', 'social_media'];
      const effectiveInputType = allowedTypes.includes(inputType) ? inputType : 'text';

      const result = await VerificationPipeline.execute({
        inputType: effectiveInputType,
        content: text,
        userId: req.user?.userId || 'anonymous',
        skipCache,
      });

      res.status(200).json(result);
    } catch (err: any) {
      next(err);
    }
  }

  public static async verifyUrl(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url, skipCache = false } = req.body;
      if (!url || !url.trim()) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'URL is required for verification.' },
        });
        return;
      }

      const isSocial = /twitter|x\.com|facebook|instagram|tiktok|youtube|youtu\.be/i.test(url);

      const result = await VerificationPipeline.execute({
        inputType: isSocial ? 'social_media' : 'url',
        content: url,
        sourceUrl: url,
        userId: req.user?.userId || 'anonymous',
        skipCache,
      });

      res.status(200).json(result);
    } catch (err: any) {
      next(err);
    }
  }

  public static async verifyImage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const { inputType = 'screenshot' } = req.body;

      if (!file) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_FILE', message: 'Image file is required.' },
        });
        return;
      }

      const result = await VerificationPipeline.execute({
        inputType: inputType === 'image' ? 'image' : 'screenshot',
        content: `Uploaded image: ${file.originalname}`,
        imageBuffer: file.buffer,
        userId: req.user?.userId || 'anonymous',
      });

      res.status(200).json(result);
    } catch (err: any) {
      next(err);
    }
  }

  public static async verifyVideo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_FILE', message: 'Video file is required.' },
        });
        return;
      }

      const result = await VerificationPipeline.execute({
        inputType: 'video',
        content: `Uploaded video: ${file.originalname}`,
        videoBuffer: file.buffer,
        filename: file.originalname,
        fileSize: file.size,
        userId: req.user?.userId || 'anonymous',
      });

      res.status(200).json(result);
    } catch (err: any) {
      next(err);
    }
  }

  public static async verifyShare(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sharedContent, url } = req.body;
      if (!sharedContent && !url) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Shared content or URL is required.' },
        });
        return;
      }

      const isUrl = url || /^https?:\/\//i.test(sharedContent);
      const result = await VerificationPipeline.execute({
        inputType: isUrl ? 'url' : 'text',
        content: sharedContent || url,
        sourceUrl: isUrl ? (url || sharedContent) : undefined,
        userId: req.user?.userId || 'anonymous',
      });

      res.status(200).json(result);
    } catch (err: any) {
      next(err);
    }
  }

  public static async getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analysisIdStr = String(req.params.analysisId);

      if (isMongoConnected) {
        try {
          const doc = await Analysis.findById(analysisIdStr);
          if (doc) {
            res.status(200).json({ success: true, data: doc });
            return;
          }
        } catch {
          // Fallthrough
        }
      }

      const found = memoryStore.analyses.get(analysisIdStr);
      if (found) {
        res.status(200).json({ success: true, data: found });
        return;
      }

      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Verification analysis record not found.' },
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || 'anonymous';
      const { verdict, search, page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;

      if (isMongoConnected) {
        try {
          const query: any = {};
          if (req.user) {
            query.userId = userId;
          }
          if (verdict && verdict !== 'all') {
            query.verdict = verdict;
          }
          if (search) {
            query.$or = [
              { originalContent: { $regex: search, $options: 'i' } },
              { explanation: { $regex: search, $options: 'i' } },
            ];
          }

          const skip = (pageNum - 1) * limitNum;
          const total = await Analysis.countDocuments(query);
          const items = await Analysis.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);

          res.status(200).json({
            success: true,
            data: { items, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
          });
          return;
        } catch {
          // Fallthrough
        }
      }

      let items = Array.from(memoryStore.analyses.values());
      if (req.user) {
        items = items.filter((a) => a.userId === userId || a.userId === 'anonymous');
      }
      if (verdict && verdict !== 'all') {
        items = items.filter((a) => a.verdict === verdict);
      }
      if (search) {
        const s = (search as string).toLowerCase();
        items = items.filter(
          (a) =>
            a.originalContent?.toLowerCase().includes(s) ||
            a.explanation?.toLowerCase().includes(s)
        );
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = items.length;
      const skip = (pageNum - 1) * limitNum;
      const paged = items.slice(skip, skip + limitNum);

      res.status(200).json({
        success: true,
        data: { items: paged, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async deleteHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const idStr = String(req.params.id);
      if (isMongoConnected) {
        try {
          await Analysis.findByIdAndDelete(idStr);
        } catch {
          // Fallthrough
        }
      }
      memoryStore.analyses.delete(idStr);

      res.status(200).json({
        success: true,
        message: 'Verification history item deleted.',
      });
    } catch (err: any) {
      next(err);
    }
  }
}
