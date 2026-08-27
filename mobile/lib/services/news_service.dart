import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../models/news_model.dart';

class NewsService {
  final ApiClient _apiClient;

  NewsService({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<NewsModel>> getNews({String? category, String? search}) async {
    final response = await _apiClient.get(
      ApiEndpoints.newsList,
      queryParameters: {
        if (category != null && category != 'All') 'category': category,
        if (search != null && search.isNotEmpty) 'search': search,
        'limit': 30,
      },
    );

    final list = (response.data['data']['items'] as List<dynamic>)
        .map((e) => NewsModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<List<NewsModel>> getTrending() async {
    final response = await _apiClient.get(ApiEndpoints.newsTrending);
    final list = (response.data['data']['items'] as List<dynamic>)
        .map((e) => NewsModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<Map<String, dynamic>> getDailyBriefing() async {
    final response = await _apiClient.get(ApiEndpoints.newsDailyBriefing);
    return response.data['data']['briefing'];
  }
}
