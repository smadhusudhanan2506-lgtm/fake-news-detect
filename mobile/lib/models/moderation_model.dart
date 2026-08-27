class ModerationItemModel {
  final String id;
  final String analysisId;
  final String claimText;
  final String originalContent;
  final String aiVerdict;
  final int aiConfidence;
  final String reportedBy;
  final String reason;
  final String priority;
  final String status;
  final String? moderatorNotes;
  final String? finalVerdict;
  final DateTime createdAt;

  ModerationItemModel({
    required this.id,
    required this.analysisId,
    required this.claimText,
    required this.originalContent,
    required this.aiVerdict,
    required this.aiConfidence,
    required this.reportedBy,
    required this.reason,
    this.priority = 'medium',
    this.status = 'pending',
    this.moderatorNotes,
    this.finalVerdict,
    required this.createdAt,
  });

  factory ModerationItemModel.fromJson(Map<String, dynamic> json) {
    return ModerationItemModel(
      id: json['_id'] ?? json['id'] ?? '',
      analysisId: json['analysisId'] is Map ? json['analysisId']['_id'] : (json['analysisId'] ?? ''),
      claimText: json['claimText'] ?? '',
      originalContent: json['originalContent'] ?? '',
      aiVerdict: json['aiVerdict'] ?? 'pending',
      aiConfidence: (json['aiConfidence'] as num?)?.toInt() ?? 0,
      reportedBy: json['reportedBy'] ?? 'User',
      reason: json['reason'] ?? 'Flagged as potential misinformation',
      priority: json['priority'] ?? 'medium',
      status: json['status'] ?? 'pending',
      moderatorNotes: json['moderatorNotes'],
      finalVerdict: json['finalVerdict'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}
