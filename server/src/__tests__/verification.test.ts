import { ClaimExtractorService } from '../services/claimExtractorService';
import { SourceReliabilityService } from '../services/sourceReliabilityService';
import { VerificationPipeline } from '../services/verificationPipeline';
import { OpenAiService } from '../services/openAiService';

describe('FactCheck AI - Core Verification Pipeline Tests', () => {
  test('ClaimExtractor should extract atomic claims and normalize text', () => {
    const rawForward =
      'Forwarded many times: Breaking News! Government has announced ₹50,000 for every student from next month. Share before it is deleted!';
    const { cleanedText, isForwarded } = ClaimExtractorService.cleanForwardedMessage(rawForward);

    expect(isForwarded).toBe(true);

    const claims = ClaimExtractorService.extractClaims(rawForward);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].normalizedClaim).toContain('50 000');
  });

  test('SourceReliabilityService should accurately rate domains', async () => {
    const govRel = await SourceReliabilityService.getReliability('https://pib.gov.in/FactCheck');
    expect(govRel.score).toBeGreaterThanOrEqual(0.95);
    expect(govRel.isGovernment).toBe(true);

    const factChecker = await SourceReliabilityService.getReliability('https://altnews.in/story');
    expect(factChecker.score).toBeGreaterThanOrEqual(0.90);
    expect(factChecker.isFactChecker).toBe(true);

    const unknownRel = await SourceReliabilityService.getReliability('https://random-unverified-blog.xyz/post');
    expect(unknownRel.score).toBeLessThanOrEqual(0.60);
  });

  test('VerificationPipeline should classify debunked scholarship claim as FALSE', async () => {
    const result = await VerificationPipeline.execute({
      inputType: 'whatsapp',
      content: 'Breaking News! Government has announced ₹50,000 for every student from next month. Claim now!',
      skipCache: true,
    });

    expect(result.success).toBe(true);
    expect(result.verdict).toBe('false');
    expect(result.confidence).toBeGreaterThan(80);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.whyPoints.length).toBeGreaterThan(0);
  });

  test('OpenAiService chat should handle verification mode with citations', async () => {
    const chatRes = await OpenAiService.generateChatResponse(
      'Are board exams cancelled for 10th and 12th?',
      [],
      'verification'
    );

    expect(chatRes.content).toBeDefined();
    expect(chatRes.content.length).toBeGreaterThan(50);
    expect(chatRes.sources.length).toBeGreaterThan(0);
  });
});
