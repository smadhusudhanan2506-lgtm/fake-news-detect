class ClaimEvidenceModel {
  final String sourceName;
  final String sourceUrl;
  final String? publisher;
  final String snippet;
  final double reliabilityScore;
  final String type;
  final String? publishedDate;

  ClaimEvidenceModel({
    required this.sourceName,
    required this.sourceUrl,
    this.publisher,
    required this.snippet,
    this.reliabilityScore = 0.8,
    this.type = 'fact_check',
    this.publishedDate,
  });

  factory ClaimEvidenceModel.fromJson(Map<String, dynamic> json) {
    return ClaimEvidenceModel(
      sourceName: json['sourceName'] ?? 'Verified Source',
      sourceUrl: json['sourceUrl'] ?? 'https://factcheck.ai',
      publisher: json['publisher'],
      snippet: json['snippet'] ?? '',
      reliabilityScore: (json['reliabilityScore'] as num?)?.toDouble() ?? 0.8,
      type: json['type'] ?? 'fact_check',
      publishedDate: json['publishedDate'],
    );
  }

  Map<String, dynamic> toJson() => {
        'sourceName': sourceName,
        'sourceUrl': sourceUrl,
        'publisher': publisher,
        'snippet': snippet,
        'reliabilityScore': reliabilityScore,
        'type': type,
        'publishedDate': publishedDate,
      };
}

class ExtractedClaimModel {
  final String claimText;
  final String normalizedClaim;
  final String verdict;
  final int confidence;
  final String? explanation;
  final List<ClaimEvidenceModel> evidence;

  ExtractedClaimModel({
    required this.claimText,
    required this.normalizedClaim,
    this.verdict = 'pending',
    this.confidence = 0,
    this.explanation,
    this.evidence = const [],
  });

  factory ExtractedClaimModel.fromJson(Map<String, dynamic> json) {
    return ExtractedClaimModel(
      claimText: json['claimText'] ?? '',
      normalizedClaim: json['normalizedClaim'] ?? '',
      verdict: json['verdict'] ?? 'pending',
      confidence: (json['confidence'] as num?)?.toInt() ?? 0,
      explanation: json['explanation'],
      evidence: (json['evidence'] as List<dynamic>?)
              ?.map((e) => ClaimEvidenceModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
