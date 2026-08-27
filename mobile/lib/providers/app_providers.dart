import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../services/storage_service.dart';
import '../services/auth_service.dart';
import '../services/verification_service.dart';
import '../services/chat_service.dart';
import '../services/news_service.dart';
import '../services/moderation_service.dart';
import '../services/tts_voice_service.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return ApiClient(storageService: storage);
});

final authServiceProvider = Provider<AuthService>((ref) {
  final api = ref.watch(apiClientProvider);
  final storage = ref.watch(storageServiceProvider);
  return AuthService(apiClient: api, storageService: storage);
});

final verificationServiceProvider = Provider<VerificationService>((ref) {
  final api = ref.watch(apiClientProvider);
  final storage = ref.watch(storageServiceProvider);
  return VerificationService(apiClient: api, storageService: storage);
});

final chatServiceProvider = Provider<ChatService>((ref) {
  final api = ref.watch(apiClientProvider);
  final storage = ref.watch(storageServiceProvider);
  return ChatService(apiClient: api, storageService: storage);
});

final newsServiceProvider = Provider<NewsService>((ref) {
  final api = ref.watch(apiClientProvider);
  return NewsService(apiClient: api);
});

final moderationServiceProvider = Provider<ModerationService>((ref) {
  final api = ref.watch(apiClientProvider);
  return ModerationService(apiClient: api);
});

final ttsVoiceServiceProvider = Provider<TtsVoiceService>((ref) {
  final tts = TtsVoiceService();
  tts.init();
  return tts;
});
