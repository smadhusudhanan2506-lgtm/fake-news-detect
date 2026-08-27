import { SourceReliability } from '../models/SourceReliability';
import { memoryStore } from '../config/memoryStore';
import { isMongoConnected } from '../config/db';

export class SourceReliabilityService {
  public static extractDomain(urlOrDomain: string): string {
    try {
      let domain = urlOrDomain.toLowerCase().trim();
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        domain = 'https://' + domain;
      }
      const parsed = new URL(domain);
      let hostname = parsed.hostname;
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      return hostname;
    } catch {
      return urlOrDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
  }

  public static async getReliability(urlOrDomain: string): Promise<{
    domain: string;
    name: string;
    score: number;
    isGovernment: boolean;
    isFactChecker: boolean;
    category: string;
  }> {
    const domain = this.extractDomain(urlOrDomain);

    if (isMongoConnected) {
      const found = await SourceReliability.findOne({ domain });
      if (found) {
        return {
          domain: found.domain,
          name: found.name,
          score: found.reliabilityScore,
          isGovernment: found.isGovernment,
          isFactChecker: found.isFactChecker,
          category: found.category,
        };
      }
    }

    if (memoryStore.sourceReliability.has(domain)) {
      const found = memoryStore.sourceReliability.get(domain);
      return {
        domain: found.domain,
        name: found.name,
        score: found.reliabilityScore,
        isGovernment: found.isGovernment,
        isFactChecker: found.isFactChecker,
        category: found.category,
      };
    }

    // Default heuristic rules
    if (domain.endsWith('.gov') || domain.endsWith('.gov.in') || domain.endsWith('.mil') || domain.endsWith('.nic.in')) {
      return {
        domain,
        name: `Government Portal (${domain})`,
        score: 0.98,
        isGovernment: true,
        isFactChecker: false,
        category: 'government',
      };
    }

    if (domain.endsWith('.edu') || domain.endsWith('.ac.in') || domain.endsWith('.org')) {
      return {
        domain,
        name: `Institutional Source (${domain})`,
        score: 0.85,
        isGovernment: false,
        isFactChecker: false,
        category: 'academic',
      };
    }

    return {
      domain,
      name: domain,
      score: 0.50,
      isGovernment: false,
      isFactChecker: false,
      category: 'unknown',
    };
  }

  public static async updateSourceScore(
    domain: string,
    name: string,
    score: number,
    isGovernment: boolean,
    isFactChecker: boolean,
    category: string,
    notes?: string
  ) {
    const cleanDomain = this.extractDomain(domain);
    const data = {
      domain: cleanDomain,
      name,
      reliabilityScore: Math.max(0.0, Math.min(1.0, score)),
      isGovernment,
      isFactChecker,
      category,
      notes,
      lastUpdated: new Date(),
    };

    if (isMongoConnected) {
      await SourceReliability.findOneAndUpdate({ domain: cleanDomain }, data, { upsert: true, new: true });
    }

    memoryStore.sourceReliability.set(cleanDomain, { ...data, _id: cleanDomain });
    return data;
  }

  public static async listAllSources() {
    if (isMongoConnected) {
      return await SourceReliability.find().sort({ reliabilityScore: -1 });
    }
    return Array.from(memoryStore.sourceReliability.values()).sort(
      (a, b) => b.reliabilityScore - a.reliabilityScore
    );
  }
}
