import { Request, Response, NextFunction } from 'express';
import { ModerationService } from '../services/moderationService';
import { SourceReliabilityService } from '../services/sourceReliabilityService';
import { AuthRequest } from '../middleware/authMiddleware';
import { ModerationStatus } from '../models/ModerationQueue';

export class ModerationController {
  public static async getQueue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page = '1', limit = '20' } = req.query;
      const result = await ModerationService.getQueue(
        status as ModerationStatus,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      next(err);
    }
  }

  public static async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ModerationService.getStats();
      res.status(200).json({ success: true, data: { stats } });
    } catch (err: any) {
      next(err);
    }
  }

  public static async submitReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { analysisId, claimText, originalContent, aiVerdict, aiConfidence, reason, priority } = req.body;
      const reportedBy = req.user?.name || req.user?.email || 'Anonymous User';

      if (!analysisId || !reason) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Analysis ID and reason are required to report.' },
        });
        return;
      }

      const item = await ModerationService.submitReport({
        analysisId,
        claimText: claimText || 'Reported Claim',
        originalContent: originalContent || 'Reported Content',
        aiVerdict: aiVerdict || 'pending',
        aiConfidence: aiConfidence || 0,
        reportedBy,
        reason,
        priority,
      });

      res.status(201).json({
        success: true,
        message: 'Content successfully reported to moderation queue.',
        data: item,
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async reviewItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const idStr = String(req.params.id);
      const { action = 'approve', notes = '', finalVerdict } = req.body;
      const moderatorId = req.user?.userId || 'mod_1';

      const updated = await ModerationService.reviewItem(idStr, moderatorId, action, notes, finalVerdict);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Moderation item not found.' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Content ${action}d successfully.`,
        data: updated,
      });
    } catch (err: any) {
      next(err);
    }
  }

  public static async approveItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    req.body.action = 'approve';
    return ModerationController.reviewItem(req, res, next);
  }

  public static async rejectItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    req.body.action = 'reject';
    return ModerationController.reviewItem(req, res, next);
  }

  public static async getSources(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sources = await SourceReliabilityService.listAllSources();
      res.status(200).json({ success: true, data: { sources } });
    } catch (err: any) {
      next(err);
    }
  }

  public static async updateSource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { domain, name, score, isGovernment, isFactChecker, category, notes } = req.body;
      if (!domain || score === undefined) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Domain and score are required.' },
        });
        return;
      }

      const updated = await SourceReliabilityService.updateSourceScore(
        domain,
        name || domain,
        parseFloat(score),
        Boolean(isGovernment),
        Boolean(isFactChecker),
        category || 'unknown',
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Source reliability rating updated.',
        data: updated,
      });
    } catch (err: any) {
      next(err);
    }
  }
}
