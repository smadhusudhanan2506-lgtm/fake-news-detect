export interface IExtractedClaimRaw {
  claimText: string;
  normalizedClaim: string;
  importance: 'high' | 'medium' | 'low';
}

export class ClaimExtractorService {
  /**
   * Normalizes a claim string for deduplication clustering
   * Removes punctuation, lowercases, strips filler words, and removes non-alphanumeric noise
   */
  public static normalizeClaim(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\d]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Cleans WhatsApp forwarded headers and sensationalist artifacts
   */
  public static cleanForwardedMessage(text: string): { cleanedText: string; isForwarded: boolean; sensationalTriggers: string[] } {
    let isForwarded = false;
    const sensationalTriggers: string[] = [];

    const forwardPatterns = [
      /forwarded\s*(many\s*times)?[:\s-]*/gi,
      /breaking\s*news\s*[:!-]*/gi,
      /urgent\s*alert\s*[:!-]*/gi,
      /share\s*(this\s*)?(before|with\s*everyone|to\s*all\s*groups)[^.!\n]*/gi,
      /government\s*official\s*notice[:\s-]*/gi,
      /100%\s*true/gi,
      /don't\s*ignore/gi,
    ];

    let cleanedText = text;

    forwardPatterns.forEach((pattern) => {
      if (pattern.test(cleanedText)) {
        isForwarded = true;
        sensationalTriggers.push(pattern.source);
        cleanedText = cleanedText.replace(pattern, ' ');
      }
    });

    cleanedText = cleanedText
      .replace(/\[\d{1,2}\/\d{1,2},?\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s*[^:]+:\s*/gi, '')
      .replace(/^[>\s*-]+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();

    return { cleanedText, isForwarded, sensationalTriggers };
  }

  /**
   * Extracts atomic claims from given text using rule-based NLP segmentation
   */
  public static extractClaims(text: string): IExtractedClaimRaw[] {
    const { cleanedText } = this.cleanForwardedMessage(text);
    
    // Split sentences using punctuation boundaries
    const rawSentences = cleanedText
      .split(/(?<=[.!?\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    if (rawSentences.length === 0) {
      if (cleanedText.trim().length > 5) {
        return [
          {
            claimText: cleanedText.trim(),
            normalizedClaim: this.normalizeClaim(cleanedText),
            importance: 'high',
          },
        ];
      }
      return [];
    }

    const claims: IExtractedClaimRaw[] = [];

    for (const sentence of rawSentences) {
      // Filter out pure calls to action or greetings
      const isGreetingOrCTA = /^(hello|hi|please\s*share|forward\s*this|good\s*morning|omg|click\s*here)/i.test(sentence);
      if (isGreetingOrCTA && sentence.length < 40) {
        continue;
      }

      const normalized = this.normalizeClaim(sentence);
      const hasNumberOrEntity = /\d+|government|minister|president|announced|approved|banned|free|rs\.|₹|\$|scheme|hospital|virus|vaccine/i.test(sentence);

      claims.push({
        claimText: sentence,
        normalizedClaim: normalized,
        importance: hasNumberOrEntity ? 'high' : 'medium',
      });
    }

    // If no claims passed filter, fallback to the cleaned text itself
    if (claims.length === 0) {
      claims.push({
        claimText: cleanedText.slice(0, 300),
        normalizedClaim: this.normalizeClaim(cleanedText.slice(0, 300)),
        importance: 'high',
      });
    }

    // Limit to max 5 most important claims to optimize token & pipeline efficiency
    return claims.slice(0, 5);
  }
}
