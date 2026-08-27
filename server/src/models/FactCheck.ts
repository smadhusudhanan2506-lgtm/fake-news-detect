import mongoose, { Document, Schema } from 'mongoose';

export interface IFactCheck extends Document {
  claim: string;
  normalizedClaim: string;
  publisher: string;
  rating: string;
  verdict: 'verified' | 'false' | 'misleading' | 'unverifiable';
  url: string;
  publishedDate?: string;
  sourceReliability: number;
  claimant?: string;
  retrievedAt: Date;
}

const FactCheckSchema = new Schema<IFactCheck>(
  {
    claim: { type: String, required: true, trim: true },
    normalizedClaim: { type: String, required: true, index: true, trim: true },
    publisher: { type: String, required: true, trim: true },
    rating: { type: String, required: true },
    verdict: {
      type: String,
      enum: ['verified', 'false', 'misleading', 'unverifiable'],
      required: true,
      index: true,
    },
    url: { type: String, required: true },
    publishedDate: { type: String },
    sourceReliability: { type: Number, default: 0.95 },
    claimant: { type: String },
    retrievedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const FactCheck = mongoose.model<IFactCheck>('FactCheck', FactCheckSchema);
