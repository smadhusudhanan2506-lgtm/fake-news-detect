import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../models/moderation_model.dart';

class ModerationService {
  final ApiClient _apiClient;

  ModerationService({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<Map<String, dynamic>> getStats() async {
    final response = await _apiClient.get(ApiEndpoints.modStats);
    return response.data['data']['stats'];
  }

  Future<List<ModerationItemModel>> getQueue({String? status}) async {
    final response = await _apiClient.get(
      ApiEndpoints.modQueue,
      queryParameters: {
        if (status != null) 'status': status,
        'limit': 50,
      },
    );
    final list = (response.data['data']['items'] as List<dynamic>)
        .map((e) => ModerationItemModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<void> reviewItem(String id, {required String action, required String notes, String? finalVerdict}) async {
    await _apiClient.post(
      ApiEndpoints.modReview(id),
      data: {
        'action': action,
        'notes': notes,
        'finalVerdict': finalVerdict,
      },
    );
  }

  Future<void> submitReport({
    required String analysisId,
    required String claimText,
    required String originalContent,
    required String aiVerdict,
    required int aiConfidence,
    required String reason,
    String priority = 'medium',
  }) async {
    await _apiClient.post(
      ApiEndpoints.modReport,
      data: {
        'analysisId': analysisId,
        'claimText': claimText,
        'originalContent': originalContent,
        'aiVerdict': aiVerdict,
        'aiConfidence': aiConfidence,
        'reason': reason,
        'priority': priority,
      },
    );
  }

  Future<List<Map<String, dynamic>>> getSources() async {
    final response = await _apiClient.get(ApiEndpoints.modSources);
    return (response.data['data']['sources'] as List<dynamic>)
        .map((e) => e as Map<String, dynamic>)
        .toList();
  }
}
