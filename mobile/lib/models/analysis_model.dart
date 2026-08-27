import 'claim_model.dart';

class SourceItemModel {
  final String name;
  final String url;
  final String? publisher;
  final double reliabilityScore;
  final bool isGovernment;
  final bool isFactChecker;

  SourceItemModel({
    required this.name,
    required this.url,
    this.publisher,
    this.reliabilityScore = 0.8,
    this.isGovernment = false,
    this.isFactChecker = false,
  });

  factory SourceItemModel.fromJson(Map<String, dynamic> json) {
    return SourceItemModel(
      name: json['name'] ?? 'Source',
      url: json['url'] ?? 'https://factcheck.ai',
      publisher: json['publisher'],
      reliabilityScore: (json['reliabilityScore'] as num?)?.toDouble() ?? 0.8,
      isGovernment: json['isGovernment'] ?? false,
      isFactChecker: json['isFactChecker'] ?? false,
    );
  }
}

class AnalysisModel {
  final String id;
  final String? userId;
  final String inputType;
  final String originalContent;
  final String? extractedText;
  final String? sourceUrl;
  final String verdict;
  final int confidence;
  final String explanation;
  final List<String> whyPoints;
  final List<ExtractedClaimModel> claims;
  final List<ClaimEvidenceModel> evidence;
  final List<SourceItemModel> sources;
  final int processingTimeMs;
  final List<String> stagesCompleted;
  final bool isCachedResult;
  final String moderationStatus;
  final DateTime createdAt;

  AnalysisModel({
    required this.id,
    this.userId,
    required this.inputType,
    required this.originalContent,
    this.extractedText,
    this.sourceUrl,
    required this.verdict,
    required this.confidence,
    required this.explanation,
    this.whyPoints = const [],
    this.claims = const [],
    this.evidence = const [],
    this.sources = const [],
    this.processingTimeMs = 0,
    this.stagesCompleted = const [],
    this.isCachedResult = false,
    this.moderationStatus = 'none',
    required this.createdAt,
  });

  factory AnalysisModel.fromJson(Map<String, dynamic> json) {
    return AnalysisModel(
      id: json['_id'] ?? json['id'] ?? json['analysisId'] ?? '',
      userId: json['userId'],
      inputType: json['inputType'] ?? 'text',
      originalContent: json['originalContent'] ?? '',
      extractedText: json['extractedText'],
      sourceUrl: json['sourceUrl'],
      verdict: json['verdict'] ?? 'pending',
      confidence: (json['confidence'] as num?)?.toInt() ?? 0,
      explanation: json['explanation'] ?? json['summary'] ?? '',
      whyPoints: (json['whyPoints'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      claims: (json['claims'] as List<dynamic>?)
              ?.map((e) => ExtractedClaimModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      evidence: (json['evidence'] as List<dynamic>?)
              ?.map((e) => ClaimEvidenceModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      sources: (json['sources'] as List<dynamic>?)
              ?.map((e) => SourceItemModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      processingTimeMs: (json['processingTimeMs'] as num?)?.toInt() ?? 0,
      stagesCompleted: (json['stagesCompleted'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      isCachedResult: json['isCachedResult'] ?? false,
      moderationStatus: json['moderationStatus'] ?? 'none',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}
