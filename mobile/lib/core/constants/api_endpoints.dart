class ApiEndpoints {
  // Default to localhost for emulator/web or local dev
  static const String baseUrl = 'http://localhost:5000/api';
  static const String wsUrl = 'http://localhost:5000/ws/chat';

  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String me = '/auth/me';
  static const String profile = '/auth/profile';
  static const String forgotPassword = '/auth/forgot-password';
  static const String demoSwitch = '/auth/demo-switch';

  // Verification
  static const String verifyText = '/verify/text';
  static const String verifyUrl = '/verify/url';
  static const String verifyImage = '/verify/image';
  static const String verifyVideo = '/verify/video';
  static const String verifyShare = '/verify/share';
  static const String verifyHistory = '/verify/history';
  static String verifyAnalysis(String id) => '/verify/$id';
  static String deleteHistoryItem(String id) => '/verify/history/$id';

  // Chat
  static const String chatMessage = '/chat';
  static const String chatConversations = '/chat/conversations';
  static String chatConversation(String id) => '/chat/$id';

  // News
  static const String newsList = '/news';
  static const String newsTrending = '/news/trending';
  static const String newsDailyBriefing = '/news/daily-briefing';

  // Moderation
  static const String modStats = '/moderation/stats';
  static const String modQueue = '/moderation/queue';
  static const String modReport = '/moderation/report';
  static String modReview(String id) => '/moderation/$id/review';
  static String modApprove(String id) => '/moderation/$id/approve';
  static String modReject(String id) => '/moderation/$id/reject';
  static const String modSources = '/moderation/sources';
}
