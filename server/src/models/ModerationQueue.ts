import mongoose, { Document, Schema } from 'mongoose';

export type ModerationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';
export type ModerationPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface IModerationQueue extends Document {
  analysisId: Schema.Types.ObjectId | string;
  claimText: string;
  originalContent: string;
  aiVerdict: string;
  aiConfidence: number;
  reportedBy: string;
  reason: string;
  priority: ModerationPriority;
  status: ModerationStatus;
  moderatorId?: string;
  moderatorNotes?: string;
  finalVerdict?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ModerationQueueSchema = new Schema<IModerationQueue>(
  {
    analysisId: { type: Schema.Types.ObjectId, ref: 'Analysis', required: true, index: true },
    claimText: { type: String, required: true },
    originalContent: { type: String, required: true },
    aiVerdict: { type: String, required: true },
    aiConfidence: { type: Number, required: true },
    reportedBy: { type: String, default: 'user' },
    reason: { type: String, required: true },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    moderatorId: { type: String },
    moderatorNotes: { type: String },
    finalVerdict: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const ModerationQueue = mongoose.model<IModerationQueue>(
  'ModerationQueue',
  ModerationQueueSchema
);
