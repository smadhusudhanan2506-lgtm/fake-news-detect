import mongoose, { Document, Schema } from 'mongoose';
import { IClaimEvidence } from './Claim';

export type InputType =
  | 'text'
  | 'whatsapp'
  | 'url'
  | 'screenshot'
  | 'image'
  | 'video'
  | 'social_media';

export type Verdict =
  | 'verified'
  | 'false'
  | 'misleading'
  | 'unverifiable'
  | 'pending';

export interface IExtractedClaimItem {
  claimText: string;
  normalizedClaim: string;
  verdict: Verdict;
  confidence: number;
  explanation?: string;
  evidence: IClaimEvidence[];
}

export interface IAnalysis extends Document {
  userId?: string;
  inputType: InputType;
  originalContent: string;
  extractedText?: string;
  sourceUrl?: string;
  mediaUrl?: string;
  platform?: string;
  claims: IExtractedClaimItem[];
  verdict: Verdict;
  confidence: number;
  evidence: IClaimEvidence[];
  explanation: string;
  whyPoints: string[];
  aiAnalysis?: string;
  aiMediaAnalysis?: {
    isAiGenerated: boolean;
    aiProbability: number;
    mediaType: string;
    classification: string;
    confidence: number;
    modelDetected?: string;
    summary: string;
    detailedAnalysis: string[];
    artifactScores: {
      facialConsistency: number;
      lightingRealism: number;
      textureNaturalness: number;
      metadataIntegrity: number;
      voiceSyncScore?: number;
    };
  };
  sources: Array<{
    name: string;
    url: string;
    publisher?: string;
    reliabilityScore: number;
    isGovernment?: boolean;
    isFactChecker?: boolean;
  }>;
  processingTimeMs: number;
  stagesCompleted: string[];
  isCachedResult?: boolean;
  moderationStatus?: 'none' | 'reported' | 'reviewed';
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    userId: { type: String, index: true, default: 'anonymous' },
    inputType: {
      type: String,
      enum: ['text', 'whatsapp', 'url', 'screenshot', 'image', 'video', 'social_media'],
      required: true,
    },
    originalContent: { type: String, required: true },
    extractedText: { type: String },
    sourceUrl: { type: String },
    mediaUrl: { type: String },
    platform: { type: String },
    claims: [
      {
        claimText: { type: String, required: true },
        normalizedClaim: { type: String, required: true },
        verdict: {
          type: String,
          enum: ['verified', 'false', 'misleading', 'unverifiable', 'pending'],
          default: 'pending',
        },
        confidence: { type: Number, default: 0 },
        explanation: { type: String },
        evidence: [
          {
            sourceName: { type: String },
            sourceUrl: { type: String },
            publisher: { type: String },
            snippet: { type: String },
            reliabilityScore: { type: Number },
            type: { type: String },
            publishedDate: { type: String },
          },
        ],
      },
    ],
    verdict: {
      type: String,
      enum: ['verified', 'false', 'misleading', 'unverifiable', 'pending'],
      default: 'pending',
      index: true,
    },
    confidence: { type: Number, required: true, default: 0 },
    evidence: [
      {
        sourceName: { type: String, required: true },
        sourceUrl: { type: String, required: true },
        publisher: { type: String },
        snippet: { type: String, required: true },
        reliabilityScore: { type: Number, default: 0.8 },
        type: { type: String, default: 'fact_check' },
        publishedDate: { type: String },
      },
    ],
    explanation: { type: String, required: true },
    whyPoints: [{ type: String }],
    aiAnalysis: { type: String },
    aiMediaAnalysis: { type: Schema.Types.Mixed },
    sources: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publisher: { type: String },
        reliabilityScore: { type: Number, default: 0.8 },
        isGovernment: { type: Boolean, default: false },
        isFactChecker: { type: Boolean, default: false },
      },
    ],
    processingTimeMs: { type: Number, default: 0 },
    stagesCompleted: [{ type: String }],
    isCachedResult: { type: Boolean, default: false },
    moderationStatus: {
      type: String,
      enum: ['none', 'reported', 'reviewed'],
      default: 'none',
    },
  },
  { timestamps: true }
);

export const Analysis = mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
