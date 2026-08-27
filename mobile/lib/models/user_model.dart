class UserModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? profileImage;
  final String role;
  final List<String> categories;
  final String theme;
  final bool notificationsEnabled;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.profileImage,
    required this.role,
    this.categories = const ['India', 'World', 'Technology', 'Science', 'Health'],
    this.theme = 'system',
    this.notificationsEnabled = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final prefs = json['preferences'] as Map<String, dynamic>? ?? {};
    final settings = json['settings'] as Map<String, dynamic>? ?? {};

    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      profileImage: json['profileImage'],
      role: json['role'] ?? 'user',
      categories: (prefs['categories'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          ['India', 'World', 'Technology', 'Science', 'Health'],
      theme: settings['theme'] ?? 'system',
      notificationsEnabled: prefs['notificationsEnabled'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'profileImage': profileImage,
        'role': role,
        'preferences': {
          'categories': categories,
          'notificationsEnabled': notificationsEnabled,
        },
        'settings': {
          'theme': theme,
        },
      };

  bool get isModerator => role == 'moderator' || role == 'admin';
  bool get isAdmin => role == 'admin';
}
