import mongoose, { Document, Schema } from 'mongoose';

export type ChatMode = 'general' | 'news' | 'verification';

export interface IChatMessageSource {
  title: string;
  url: string;
  sourceName: string;
  reliabilityScore?: number;
}

export interface IChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: ChatMode;
  verdict?: 'verified' | 'false' | 'misleading' | 'unverifiable';
  confidence?: number;
  sources?: IChatMessageSource[];
  timestamp: Date;
}

export interface IConversation extends Document {
  userId: string;
  title: string;
  mode: ChatMode;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Conversation' },
    mode: {
      type: String,
      enum: ['general', 'news', 'verification'],
      default: 'general',
      index: true,
    },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, required: true },
        mode: { type: String, enum: ['general', 'news', 'verification'] },
        verdict: { type: String, enum: ['verified', 'false', 'misleading', 'unverifiable'] },
        confidence: { type: Number },
        sources: [
          {
            title: { type: String },
            url: { type: String },
            sourceName: { type: String },
            reliabilityScore: { type: Number },
          },
        ],
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Conversation = mongoose.model<IConversation>(
  'Conversation',
  ConversationSchema
);
