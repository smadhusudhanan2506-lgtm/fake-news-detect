import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { config } from '../config/env';
import { memoryStore } from '../config/memoryStore';
import { isMongoConnected } from '../config/db';

export interface ITokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  name: string;
}

export class AuthService {
  public static generateToken(user: { _id?: any; id?: string; email: string; role: 'user' | 'moderator' | 'admin'; name: string }): string {
    const payload: ITokenPayload = {
      userId: user._id?.toString() || user.id || '',
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });
  }

  public static verifyToken(token: string): ITokenPayload | null {
    try {
      return jwt.verify(token, config.jwtSecret) as ITokenPayload;
    } catch {
      return null;
    }
  }

  public static async register(data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role?: 'user' | 'moderator' | 'admin';
    firebaseUid?: string;
  }) {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    const role = data.role || 'user';

    const userData = {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      password: hashedPassword,
      firebaseUid: data.firebaseUid,
      role,
      preferences: {
        categories: ['India', 'World', 'Technology', 'Science', 'Politics', 'Health'],
        location: { country: 'India', city: 'New Delhi' },
        notificationsEnabled: true,
        dailyBriefingTime: '08:00',
        language: 'en',
      },
      settings: {
        theme: 'system' as const,
        fontSize: 'medium' as const,
        ttsAutoPlay: false,
        haptics: true,
        dataRetentionDays: 90,
      },
    };

    if (isMongoConnected) {
      try {
        const doc = new User(userData);
        const saved = await doc.save();
        const token = this.generateToken(saved);
        return { user: saved.toObject(), token };
      } catch {
        // Fallthrough
      }
    }

    const genId = memoryStore.generateId();
    const saved = { ...userData, _id: genId, createdAt: new Date(), updatedAt: new Date() };
    memoryStore.users.set(genId, saved);
    const token = this.generateToken(saved);
    return { user: saved, token };
  }

  public static async login(email: string, password?: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (password && user.password) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        throw new Error('Invalid email or password');
      }
    }

    const token = this.generateToken(user);
    const userSafe = { ...user };
    delete userSafe.password;

    return { user: userSafe, token };
  }

  public static async findByEmail(email: string): Promise<any | null> {
    const cleanEmail = email.toLowerCase().trim();

    if (isMongoConnected) {
      try {
        const doc = await User.findOne({ email: cleanEmail });
        if (doc) return doc.toObject();
      } catch {
        // Fallthrough
      }
    }

    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        return u;
      }
    }

    return null;
  }

  public static async findById(id: string): Promise<any | null> {
    if (isMongoConnected) {
      try {
        const doc = await User.findById(id);
        if (doc) return doc.toObject();
      } catch {
        // Fallthrough
      }
    }

    return memoryStore.users.get(id) || null;
  }

  public static async updateProfile(userId: string, updateData: any) {
    if (isMongoConnected) {
      try {
        const doc = await User.findByIdAndUpdate(userId, updateData, { new: true });
        if (doc) return doc.toObject();
      } catch {
        // Fallthrough
      }
    }

    const u = memoryStore.users.get(userId);
    if (u) {
      Object.assign(u, updateData, { updatedAt: new Date() });
      return u;
    }

    return null;
  }
}
