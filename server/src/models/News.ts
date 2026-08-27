import mongoose, { Document, Schema } from 'mongoose';

export type NewsCategory =
  | 'Tamil Nadu'
  | 'India'
  | 'World'
  | 'Technology'
  | 'Science'
  | 'Politics'
  | 'Business'
  | 'Sports'
  | 'Entertainment'
  | 'Health'
  | 'Education';

export interface INews extends Document {
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  source: string;
  sourceUrl: string;
  category: NewsCategory;
  country: string;
  language: string;
  publishedAt: Date;
  reliabilityScore: number;
  tags: string[];
  isVerified: boolean;
  isTrending: boolean;
  summaryBulletPoints?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new Schema<INews>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    source: { type: String, required: true },
    sourceUrl: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: [
        'Tamil Nadu',
        'India',
        'World',
        'Technology',
        'Science',
        'Politics',
        'Business',
        'Sports',
        'Entertainment',
        'Health',
        'Education',
      ],
      required: true,
      index: true,
    },
    country: { type: String, default: 'India', index: true },
    language: { type: String, default: 'en' },
    publishedAt: { type: Date, default: Date.now, index: true },
    reliabilityScore: { type: Number, default: 0.9 },
    tags: [{ type: String }],
    isVerified: { type: Boolean, default: true },
    isTrending: { type: Boolean, default: false },
    summaryBulletPoints: [{ type: String }],
  },
  { timestamps: true }
);

export const News = mongoose.model<INews>('News', NewsSchema);
