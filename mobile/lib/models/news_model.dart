class NewsModel {
  final String id;
  final String title;
  final String description;
  final String content;
  final String? imageUrl;
  final String source;
  final String sourceUrl;
  final String category;
  final String country;
  final double reliabilityScore;
  final List<String> tags;
  final bool isVerified;
  final bool isTrending;
  final List<String> summaryBulletPoints;
  final DateTime publishedAt;

  NewsModel({
    required this.id,
    required this.title,
    required this.description,
    required this.content,
    this.imageUrl,
    required this.source,
    required this.sourceUrl,
    required this.category,
    this.country = 'India',
    this.reliabilityScore = 0.9,
    this.tags = const [],
    this.isVerified = true,
    this.isTrending = false,
    this.summaryBulletPoints = const [],
    required this.publishedAt,
  });

  factory NewsModel.fromJson(Map<String, dynamic> json) {
    return NewsModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      content: json['content'] ?? '',
      imageUrl: json['imageUrl'],
      source: json['source'] ?? 'Verified News',
      sourceUrl: json['sourceUrl'] ?? '',
      category: json['category'] ?? 'India',
      country: json['country'] ?? 'India',
      reliabilityScore: (json['reliabilityScore'] as num?)?.toDouble() ?? 0.9,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      isVerified: json['isVerified'] ?? true,
      isTrending: json['isTrending'] ?? false,
      summaryBulletPoints: (json['summaryBulletPoints'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      publishedAt: json['publishedAt'] != null ? DateTime.parse(json['publishedAt']) : DateTime.now(),
    );
  }
}
