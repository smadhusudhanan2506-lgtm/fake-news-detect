import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreferences {
  categories: string[];
  location?: {
    country: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  notificationsEnabled: boolean;
  dailyBriefingTime?: string;
  language: string;
}

export interface IUserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  ttsAutoPlay: boolean;
  haptics: boolean;
  dataRetentionDays: number;
}

export interface IUser extends Document {
  firebaseUid?: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  profileImage?: string;
  role: 'user' | 'moderator' | 'admin';
  preferences: IUserPreferences;
  settings: IUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, sparse: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String },
    profileImage: { type: String, default: '' },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
      index: true,
    },
    preferences: {
      categories: {
        type: [String],
        default: ['India', 'World', 'Technology', 'Science', 'Politics', 'Health'],
      },
      location: {
        country: { type: String, default: 'India' },
        city: { type: String, default: 'New Delhi' },
        latitude: { type: Number },
        longitude: { type: Number },
      },
      notificationsEnabled: { type: Boolean, default: true },
      dailyBriefingTime: { type: String, default: '08:00' },
      language: { type: String, default: 'en' },
    },
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
      ttsAutoPlay: { type: Boolean, default: false },
      haptics: { type: Boolean, default: true },
      dataRetentionDays: { type: Number, default: 90 },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
