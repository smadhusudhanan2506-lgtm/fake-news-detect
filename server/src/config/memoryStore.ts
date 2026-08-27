import { IUser } from '../models/User';
import { IAnalysis } from '../models/Analysis';
import { IClaim } from '../models/Claim';
import { IFactCheck } from '../models/FactCheck';
import { INews } from '../models/News';
import { IConversation } from '../models/Conversation';
import { IModerationQueue } from '../models/ModerationQueue';
import { ISourceReliability } from '../models/SourceReliability';

class MemoryStore {
  public users: Map<string, any> = new Map();
  public analyses: Map<string, any> = new Map();
  public claims: Map<string, any> = new Map();
  public factChecks: Map<string, any> = new Map();
  public news: Map<string, any> = new Map();
  public tamilNews: Map<string, any> = new Map();
  public conversations: Map<string, any> = new Map();
  public moderationQueue: Map<string, any> = new Map();
  public sourceReliability: Map<string, any> = new Map();

  constructor() {
    this.initDefaultSources();
  }

  private initDefaultSources() {
    const defaults = [
      { domain: 'pib.gov.in', name: 'Press Information Bureau (PIB)', category: 'government', reliabilityScore: 0.98, isGovernment: true, isFactChecker: false },
      { domain: 'who.int', name: 'World Health Organization (WHO)', category: 'government', reliabilityScore: 0.98, isGovernment: true, isFactChecker: false },
      { domain: 'altnews.in', name: 'Alt News', category: 'fact_checker', reliabilityScore: 0.96, isGovernment: false, isFactChecker: true },
      { domain: 'boomlive.in', name: 'BOOM Live', category: 'fact_checker', reliabilityScore: 0.95, isGovernment: false, isFactChecker: true },
      { domain: 'snopes.com', name: 'Snopes', category: 'fact_checker', reliabilityScore: 0.95, isGovernment: false, isFactChecker: true },
      { domain: 'reuters.com', name: 'Reuters', category: 'mainstream_news', reliabilityScore: 0.93, isGovernment: false, isFactChecker: false },
      { domain: 'bbc.com', name: 'BBC News', category: 'mainstream_news', reliabilityScore: 0.92, isGovernment: false, isFactChecker: false },
      { domain: 'thehindu.com', name: 'The Hindu', category: 'mainstream_news', reliabilityScore: 0.90, isGovernment: false, isFactChecker: false },
      { domain: 'indiatoday.in', name: 'India Today Fact Check', category: 'fact_checker', reliabilityScore: 0.91, isGovernment: false, isFactChecker: true },
      { domain: 'twitter.com', name: 'X / Twitter (Unverified)', category: 'social_media', reliabilityScore: 0.25, isGovernment: false, isFactChecker: false },
      { domain: 'facebook.com', name: 'Facebook Post', category: 'social_media', reliabilityScore: 0.20, isGovernment: false, isFactChecker: false },
      { domain: 'whatsapp.com', name: 'WhatsApp Forwarded Message', category: 'social_media', reliabilityScore: 0.15, isGovernment: false, isFactChecker: false },
    ];

    defaults.forEach((s) => {
      this.sourceReliability.set(s.domain, { ...s, _id: s.domain, createdAt: new Date(), updatedAt: new Date() });
    });
  }

  public generateId(): string {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }
}

export const memoryStore = new MemoryStore();
