import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import '../core/constants/api_endpoints.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../models/analysis_model.dart';
import 'storage_service.dart';

class VerificationService {
  final ApiClient _apiClient;
  final StorageService _storageService;

  VerificationService({
    required ApiClient apiClient,
    required StorageService storageService,
  })  : _apiClient = apiClient,
        _storageService = storageService;

  Future<AnalysisModel> verifyText(String text, {String inputType = 'text', bool skipCache = false}) async {
    final response = await _apiClient.post(
      ApiEndpoints.verifyText,
      data: {
        'text': text,
        'inputType': inputType,
        'skipCache': skipCache,
      },
    );
    final model = AnalysisModel.fromJson(response.data);
    await _cacheAnalysis(model);
    return model;
  }

  Future<AnalysisModel> verifyUrl(String url, {bool skipCache = false}) async {
    final response = await _apiClient.post(
      ApiEndpoints.verifyUrl,
      data: {
        'url': url,
        'skipCache': skipCache,
      },
    );
    final model = AnalysisModel.fromJson(response.data);
    await _cacheAnalysis(model);
    return model;
  }

  Future<AnalysisModel> verifyImageBytes(Uint8List bytes, String filename, {String inputType = 'screenshot'}) async {
    final formData = FormData.fromMap({
      'inputType': inputType,
      'image': MultipartFile.fromBytes(bytes, filename: filename),
    });

    final response = await _apiClient.post(
      ApiEndpoints.verifyImage,
      data: formData,
    );
    final model = AnalysisModel.fromJson(response.data);
    await _cacheAnalysis(model);
    return model;
  }

  Future<AnalysisModel> verifyVideoBytes(Uint8List bytes, String filename) async {
    final formData = FormData.fromMap({
      'video': MultipartFile.fromBytes(bytes, filename: filename),
    });

    final response = await _apiClient.post(
      ApiEndpoints.verifyVideo,
      data: formData,
    );
    final model = AnalysisModel.fromJson(response.data);
    await _cacheAnalysis(model);
    return model;
  }

  Future<AnalysisModel> verifyShare(String sharedContent) async {
    final response = await _apiClient.post(
      ApiEndpoints.verifyShare,
      data: {'sharedContent': sharedContent},
    );
    final model = AnalysisModel.fromJson(response.data);
    await _cacheAnalysis(model);
    return model;
  }

  Future<List<AnalysisModel>> getHistory({String verdict = 'all', String search = ''}) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.verifyHistory,
        queryParameters: {
          'verdict': verdict,
          'search': search,
          'limit': 50,
        },
      );
      final list = (response.data['data']['items'] as List<dynamic>)
          .map((e) => AnalysisModel.fromJson(e as Map<String, dynamic>))
          .toList();
      return list;
    } catch (_) {
      return _getCachedHistory();
    }
  }

  Future<void> deleteHistory(String id) async {
    await _apiClient.delete(ApiEndpoints.deleteHistoryItem(id));
  }

  Future<void> _cacheAnalysis(AnalysisModel model) async {
    try {
      final cached = await _getCachedHistory();
      cached.insert(0, model);
      final jsonList = cached.take(20).map((a) => {
        '_id': a.id,
        'inputType': a.inputType,
        'originalContent': a.originalContent,
        'verdict': a.verdict,
        'confidence': a.confidence,
        'explanation': a.explanation,
        'createdAt': a.createdAt.toIso8601String(),
      }).toList();
      await _storageService.setString(AppConstants.keyCachedHistory, jsonEncode(jsonList));
    } catch (_) {}
  }

  Future<List<AnalysisModel>> _getCachedHistory() async {
    try {
      final raw = await _storageService.getString(AppConstants.keyCachedHistory);
      if (raw != null) {
        final decoded = jsonDecode(raw) as List<dynamic>;
        return decoded.map((e) => AnalysisModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }
}
