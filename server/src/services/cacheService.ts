export class CacheService {
  private static cacheMap: Map<string, { analysis: any; timestamp: number }> = new Map();
  private static CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes memory cache

  public static async getCachedAnalysis(normalizedClaim: string): Promise<any | null> {
    if (!normalizedClaim || normalizedClaim.length < 5) return null;

    // Check memory cache
    const memoryHit = this.cacheMap.get(normalizedClaim);
    if (memoryHit && Date.now() - memoryHit.timestamp < this.CACHE_TTL_MS) {
      return { ...memoryHit.analysis, isCachedResult: true };
    }

    return null;
  }

  public static setCache(normalizedClaim: string, analysis: any): void {
    if (normalizedClaim && analysis) {
      this.cacheMap.set(normalizedClaim, { analysis, timestamp: Date.now() });
    }
  }

  public static clearCache(): void {
    this.cacheMap.clear();
  }
}
