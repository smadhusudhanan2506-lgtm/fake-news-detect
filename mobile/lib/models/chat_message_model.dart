class ChatSourceModel {
  final String title;
  final String url;
  final String sourceName;
  final double? reliabilityScore;

  ChatSourceModel({
    required this.title,
    required this.url,
    required this.sourceName,
    this.reliabilityScore,
  });

  factory ChatSourceModel.fromJson(Map<String, dynamic> json) {
    return ChatSourceModel(
      title: json['title'] ?? '',
      url: json['url'] ?? '',
      sourceName: json['sourceName'] ?? '',
      reliabilityScore: (json['reliabilityScore'] as num?)?.toDouble(),
    );
  }
}

class ChatMessageModel {
  final String role; // 'user' | 'assistant'
  final String content;
  final String mode; // 'general' | 'news' | 'verification'
  final String? verdict;
  final int? confidence;
  final List<ChatSourceModel> sources;
  final DateTime timestamp;
  final bool isStreaming;

  ChatMessageModel({
    required this.role,
    required this.content,
    this.mode = 'general',
    this.verdict,
    this.confidence,
    this.sources = const [],
    required this.timestamp,
    this.isStreaming = false,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      role: json['role'] ?? 'assistant',
      content: json['content'] ?? '',
      mode: json['mode'] ?? 'general',
      verdict: json['verdict'],
      confidence: (json['confidence'] as num?)?.toInt(),
      sources: (json['sources'] as List<dynamic>?)
              ?.map((e) => ChatSourceModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      timestamp: json['timestamp'] != null ? DateTime.parse(json['timestamp']) : DateTime.now(),
      isStreaming: false,
    );
  }

  bool get isUser => role == 'user';
}
