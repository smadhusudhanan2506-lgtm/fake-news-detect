import { ModerationQueue, IModerationQueue, ModerationPriority, ModerationStatus } from '../models/ModerationQueue';
import { Analysis } from '../models/Analysis';
import { memoryStore } from '../config/memoryStore';
import { isMongoConnected } from '../config/db';

export class ModerationService {
  /**
   * Submit an analysis or claim for moderator review
   */
  public static async submitReport(data: {
    analysisId: string;
    claimText: string;
    originalContent: string;
    aiVerdict: string;
    aiConfidence: number;
    reportedBy: string;
    reason: string;
    priority?: ModerationPriority;
  }) {
    const item = {
      ...data,
      priority: data.priority || 'medium',
      status: 'pending' as ModerationStatus,
      createdAt: new Date(),
    };

    if (isMongoConnected) {
      try {
        const doc = new ModerationQueue(item);
        const saved = await doc.save();
        await Analysis.findByIdAndUpdate(data.analysisId, { moderationStatus: 'reported' });
        return saved;
      } catch {
        // Fallthrough
      }
    }

    const genId = memoryStore.generateId();
    const saved = { ...item, _id: genId };
    memoryStore.moderationQueue.set(genId, saved);

    const an = memoryStore.analyses.get(data.analysisId);
    if (an) an.moderationStatus = 'reported';

    return saved;
  }

  /**
   * Get moderation statistics
   */
  public static async getStats() {
    if (isMongoConnected) {
      try {
        const [pending, reviewing, approved, rejected, total] = await Promise.all([
          ModerationQueue.countDocuments({ status: 'pending' }),
          ModerationQueue.countDocuments({ status: 'reviewing' }),
          ModerationQueue.countDocuments({ status: 'approved' }),
          ModerationQueue.countDocuments({ status: 'rejected' }),
          ModerationQueue.countDocuments(),
        ]);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const reportsToday = await ModerationQueue.countDocuments({ createdAt: { $gte: todayStart } });

        return { pending, reviewing, approved, rejected, total, reportsToday };
      } catch {
        // Fallthrough
      }
    }

    const items = Array.from(memoryStore.moderationQueue.values());
    const pending = items.filter((i) => i.status === 'pending').length;
    const reviewing = items.filter((i) => i.status === 'reviewing').length;
    const approved = items.filter((i) => i.status === 'approved').length;
    const rejected = items.filter((i) => i.status === 'rejected').length;

    return {
      pending,
      reviewing,
      approved,
      rejected,
      total: items.length,
      reportsToday: items.length,
    };
  }

  /**
   * Get queue items with filtering
   */
  public static async getQueue(status?: ModerationStatus, page = 1, limit = 20) {
    if (isMongoConnected) {
      try {
        const query: any = status ? { status } : {};
        const skip = (page - 1) * limit;
        const total = await ModerationQueue.countDocuments(query);
        const items = await ModerationQueue.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
        return { items, total, page, totalPages: Math.ceil(total / limit) };
      } catch {
        // Fallthrough
      }
    }

    let items = Array.from(memoryStore.moderationQueue.values());
    if (status) items = items.filter((i) => i.status === status);
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const skip = (page - 1) * limit;
    const paged = items.slice(skip, skip + limit);

    return { items: paged, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Process review decision (Approve / Reject / Modify verdict)
   */
  public static async reviewItem(
    id: string,
    moderatorId: string,
    action: 'approve' | 'reject' | 'update_verdict',
    notes: string,
    finalVerdict?: string
  ) {
    const updateData: any = {
      moderatorId,
      moderatorNotes: notes,
      status: action === 'approve' ? 'approved' : 'rejected',
      finalVerdict: finalVerdict || undefined,
      reviewedAt: new Date(),
    };

    if (isMongoConnected) {
      try {
        const updated = await ModerationQueue.findByIdAndUpdate(id, updateData, { new: true });
        if (updated && finalVerdict) {
          await Analysis.findByIdAndUpdate(updated.analysisId, {
            verdict: finalVerdict,
            moderationStatus: 'reviewed',
          });
        }
        return updated;
      } catch {
        // Fallthrough
      }
    }

    const item = memoryStore.moderationQueue.get(id);
    if (item) {
      Object.assign(item, updateData);
      if (finalVerdict && item.analysisId) {
        const an = memoryStore.analyses.get(item.analysisId);
        if (an) {
          an.verdict = finalVerdict;
          an.moderationStatus = 'reviewed';
        }
      }
      return item;
    }

    return null;
  }
}
