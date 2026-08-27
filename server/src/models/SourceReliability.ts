import mongoose, { Document, Schema } from 'mongoose';

export interface ISourceReliability extends Document {
  domain: string;
  name: string;
  category: 'government' | 'fact_checker' | 'mainstream_news' | 'academic' | 'blog' | 'social_media' | 'unknown';
  reliabilityScore: number; // 0.0 to 1.0
  isGovernment: boolean;
  isFactChecker: boolean;
  notes?: string;
  lastUpdated: Date;
}

const SourceReliabilitySchema = new Schema<ISourceReliability>(
  {
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'government',
        'fact_checker',
        'mainstream_news',
        'academic',
        'blog',
        'social_media',
        'unknown',
      ],
      default: 'unknown',
    },
    reliabilityScore: { type: Number, required: true, min: 0.0, max: 1.0, default: 0.5 },
    isGovernment: { type: Boolean, default: false },
    isFactChecker: { type: Boolean, default: false },
    notes: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SourceReliability = mongoose.model<ISourceReliability>(
  'SourceReliability',
  SourceReliabilitySchema
);
