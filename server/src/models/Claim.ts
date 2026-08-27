import mongoose, { Document, Schema } from 'mongoose';

export interface IClaimEvidence {
  sourceName: string;
  sourceUrl: string;
  publisher?: string;
  snippet: string;
  reliabilityScore: number;
  type: 'fact_check' | 'news' | 'government' | 'academic' | 'other';
  publishedDate?: string;
}

export interface IClaim extends Document {
  claimText: string;
  normalizedClaim: string;
  importance: 'high' | 'medium' | 'low';
  verdict: 'verified' | 'false' | 'misleading' | 'unverifiable' | 'pending';
  evidence: IClaimEvidence[];
  sources: string[];
  frequencyCount: number;
  lastVerifiedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
  {
    claimText: { type: String, required: true, trim: true },
    normalizedClaim: { type: String, required: true, index: true, trim: true },
    importance: { type: String, enum: ['high', 'medium', 'low'], default: 'high' },
    verdict: {
      type: String,
      enum: ['verified', 'false', 'misleading', 'unverifiable', 'pending'],
      default: 'pending',
      index: true,
    },
    evidence: [
      {
        sourceName: { type: String, required: true },
        sourceUrl: { type: String, required: true },
        publisher: { type: String },
        snippet: { type: String, required: true },
        reliabilityScore: { type: Number, default: 0.8 },
        type: {
          type: String,
          enum: ['fact_check', 'news', 'government', 'academic', 'other'],
          default: 'fact_check',
        },
        publishedDate: { type: String },
      },
    ],
    sources: [{ type: String }],
    frequencyCount: { type: Number, default: 1 },
    lastVerifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Claim = mongoose.model<IClaim>('Claim', ClaimSchema);
