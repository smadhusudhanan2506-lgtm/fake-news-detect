import { Analysis, IAnalysis, InputType, Verdict, IExtractedClaimItem } from '../models/Analysis';
import { IClaimEvidence } from '../models/Claim';
import { ClaimExtractorService } from './claimExtractorService';
import { FactCheckService } from './factCheckService';
import { OpenAiService } from './openAiService';
import { SourceReliabilityService } from './sourceReliabilityService';
import { CacheService } from './cacheService';
import { OcrService } from './ocrService';
import { MediaAnalysisService } from './mediaAnalysisService';
import { AiMediaDetectorService } from './aiMediaDetectorService';
import { memoryStore } from '../config/memoryStore';
import { isMongoConnected } from '../config/db';
import { logger } from '../config/logger';

export interface IVerificationRequestOptions {
  inputType: InputType;
  content: string;
  userId?: string;
  sourceUrl?: string;
  imageBuffer?: Buffer;
  videoBuffer?: Buffer;
  filename?: string;
  fileSize?: number;
  skipCache?: boolean;
}

export class VerificationPipeline {
  /**
   * Main verification pipeline execution
   */
  public static async execute(options: IVerificationRequestOptions): Promise<any> {
    const startTime = Date.now();
    const stagesCompleted: string[] = [];
    const userId = options.userId || 'anonymous';

    logger.info(`Starting verification pipeline for inputType: ${options.inputType}`);

    // STAGE 1: Input Processor & Text Extraction
    stagesCompleted.push('Reading content...');
    let rawText = options.content;
    let platform = 'text';

    const trimmedContent = (options.content || '').trim();
    const isUrl = trimmedContent.startsWith('http://') || trimmedContent.startsWith('https://');

    if (options.inputType === 'screenshot' || options.inputType === 'image') {
      if (options.imageBuffer) {
        const ocr = await OcrService.extractText(options.imageBuffer);
        rawText = ocr.text;
      }
    } else if (options.inputType === 'video') {
      const vid = await MediaAnalysisService.processVideo(options.filename || 'video.mp4', options.fileSize || 1024);
      rawText = `${vid.transcribedAudioText}\n${vid.extractedFrameText}`;
    } else if (options.inputType === 'url' || options.inputType === 'social_media' || isUrl) {
      stagesCompleted.push('Extracting video metadata & captions...');
      const targetUrl = isUrl ? trimmedContent : (options.sourceUrl || options.content);
      const parsedSocial = await MediaAnalysisService.parseSocialUrl(targetUrl);
      platform = parsedSocial.platform;
      rawText = parsedSocial.extractedText ? `${parsedSocial.title}. ${parsedSocial.extractedText}` : parsedSocial.title;
      options.sourceUrl = targetUrl;
    }

    // STAGE 2: Claim Extraction & Normalization
    stagesCompleted.push('Extracting claims...');
    const extractedClaims = ClaimExtractorService.extractClaims(rawText);
    const primaryClaim = extractedClaims[0] || {
      claimText: rawText.slice(0, 200),
      normalizedClaim: ClaimExtractorService.normalizeClaim(rawText.slice(0, 200)),
      importance: 'high',
    };

    // Check cache
    if (!options.skipCache) {
      const cached = await CacheService.getCachedAnalysis(primaryClaim.normalizedClaim);
      if (cached) {
        logger.info(`Cache hit for claim: "${primaryClaim.normalizedClaim.slice(0, 30)}"`);
        return {
          ...cached,
          isCachedResult: true,
          processingTimeMs: Date.now() - startTime,
        };
      }
    }

    // STAGE 3: Search Fact-Check & Trusted Sources
    stagesCompleted.push('Searching fact-check sources...');
    const evidenceList: IClaimEvidence[] = [];

    // Search fact-checks
    const factChecks = await FactCheckService.searchFactChecks(primaryClaim.claimText);
    evidenceList.push(...factChecks);

    // STAGE 4: Source Reliability Evaluation
    stagesCompleted.push('Checking trusted news & government sources...');
    const sourcesSummary: Array<{
      name: string;
      url: string;
      publisher?: string;
      reliabilityScore: number;
      isGovernment?: boolean;
      isFactChecker?: boolean;
    }> = [];

    for (const ev of evidenceList) {
      const rel = await SourceReliabilityService.getReliability(ev.sourceUrl);
      sourcesSummary.push({
        name: ev.sourceName || rel.name,
        url: ev.sourceUrl,
        publisher: ev.publisher,
        reliabilityScore: rel.score,
        isGovernment: rel.isGovernment,
        isFactChecker: rel.isFactChecker,
      });
    }

    // If no external evidence, add default source rating
    if (sourcesSummary.length === 0) {
      const fallbackRel = await SourceReliabilityService.getReliability(
        options.sourceUrl || (options.inputType === 'whatsapp' ? 'whatsapp.com' : 'web')
      );
      sourcesSummary.push({
        name: fallbackRel.name,
        url: options.sourceUrl || 'https://factcheck.ai',
        reliabilityScore: fallbackRel.score,
        isGovernment: fallbackRel.isGovernment,
        isFactChecker: fallbackRel.isFactChecker,
      });
    }

    // STAGE 5: Comparing Evidence & AI Synthesis
    stagesCompleted.push('Comparing evidence...');
    stagesCompleted.push('Generating explanation...');

    // Run AI Image & Video Deepfake Detector if media is present
    let aiMediaAnalysis: any = null;
    if (options.inputType === 'image' || options.inputType === 'screenshot' || options.inputType === 'video' || options.inputType === 'social_media') {
      stagesCompleted.push('Scanning for AI generation & deepfakes...');
      const mediaKind = options.inputType === 'video' ? 'video' : options.inputType === 'social_media' ? 'reel' : options.inputType === 'screenshot' ? 'screenshot' : 'image';
      aiMediaAnalysis = await AiMediaDetectorService.analyzeMedia({
        mediaType: mediaKind,
        imageBuffer: options.imageBuffer,
        videoBuffer: options.videoBuffer,
        filename: options.filename,
        textContext: rawText,
      });
    }

    const synthesis = await OpenAiService.synthesizeVerification(
      primaryClaim.claimText,
      evidenceList,
      options.inputType
    );

    // If AI media detector flagged high confidence AI generation or deepfake, reflect in verdict
    if (aiMediaAnalysis && (aiMediaAnalysis.classification === 'AI_GENERATED' || aiMediaAnalysis.classification === 'DEEPFAKE_MANIPULATED')) {
      if (synthesis.verdict === 'verified' || synthesis.verdict === 'unverifiable') {
        synthesis.verdict = 'false';
        synthesis.confidence = Math.max(synthesis.confidence, aiMediaAnalysis.confidence);
        synthesis.explanation = `⚠️ AI Generated / Deepfake Media: ${aiMediaAnalysis.summary} ${synthesis.explanation}`;
        synthesis.whyPoints.unshift(`🤖 AI Generation Detected: Forensic inspection confirmed ${aiMediaAnalysis.modelDetected || 'synthetic neural generation'} with ${aiMediaAnalysis.aiProbability}% AI probability.`);
      }
    }

    stagesCompleted.push('Verification complete.');

    // Build Claim Items
    const claimsOutput: IExtractedClaimItem[] = extractedClaims.map((c) => ({
      claimText: c.claimText,
      normalizedClaim: c.normalizedClaim,
      verdict: synthesis.verdict,
      confidence: synthesis.confidence,
      explanation: synthesis.explanation,
      evidence: evidenceList,
    }));

    const processingTimeMs = Date.now() - startTime;

    const analysisData = {
      userId,
      inputType: options.inputType,
      originalContent: options.content,
      extractedText: rawText !== options.content ? rawText : undefined,
      sourceUrl: options.sourceUrl,
      platform,
      claims: claimsOutput,
      verdict: synthesis.verdict,
      confidence: synthesis.confidence,
      evidence: evidenceList,
      explanation: synthesis.explanation,
      whyPoints: synthesis.whyPoints,
      aiAnalysis: synthesis.aiAnalysisText,
      aiMediaAnalysis,
      sources: sourcesSummary,
      processingTimeMs,
      stagesCompleted,
      isCachedResult: false,
      moderationStatus: 'none' as const,
      createdAt: new Date(),
    };

    // STAGE 6: Save to Database & Cache
    let savedDoc: any = null;

    if (isMongoConnected) {
      try {
        const doc = new Analysis(analysisData);
        savedDoc = await doc.save();
      } catch (err: any) {
        logger.warn(`Failed to save analysis to MongoDB (${err.message}). Storing in MemoryStore.`);
      }
    }

    if (!savedDoc) {
      const genId = memoryStore.generateId();
      savedDoc = { ...analysisData, _id: genId };
      memoryStore.analyses.set(genId, savedDoc);
    }

    // Cache normalized claim
    CacheService.setCache(primaryClaim.normalizedClaim, savedDoc);

    return {
      success: true,
      analysisId: savedDoc._id,
      verdict: savedDoc.verdict,
      confidence: savedDoc.confidence,
      summary: savedDoc.explanation,
      explanation: savedDoc.explanation,
      whyPoints: savedDoc.whyPoints,
      aiMediaAnalysis: savedDoc.aiMediaAnalysis,
      claims: savedDoc.claims,
      evidence: savedDoc.evidence,
      sources: savedDoc.sources,
      processingTimeMs: savedDoc.processingTimeMs,
      stagesCompleted: savedDoc.stagesCompleted,
      createdAt: savedDoc.createdAt,
    };
  }
}
