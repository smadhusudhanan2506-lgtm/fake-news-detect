import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/news_model.dart';
import 'app_providers.dart';

class NewsState {
  final List<NewsModel> newsList;
  final List<NewsModel> trendingList;
  final Map<String, dynamic>? dailyBriefing;
  final String selectedCategory;
  final bool isLoading;
  final String? error;

  NewsState({
    this.newsList = const [],
    this.trendingList = const [],
    this.dailyBriefing,
    this.selectedCategory = 'All',
    this.isLoading = false,
    this.error,
  });

  NewsState copyWith({
    List<NewsModel>? newsList,
    List<NewsModel>? trendingList,
    Map<String, dynamic>? dailyBriefing,
    String? selectedCategory,
    bool? isLoading,
    String? error,
  }) {
    return NewsState(
      newsList: newsList ?? this.newsList,
      trendingList: trendingList ?? this.trendingList,
      dailyBriefing: dailyBriefing ?? this.dailyBriefing,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class NewsNotifier extends StateNotifier<NewsState> {
  final Ref _ref;

  NewsNotifier(this._ref) : super(NewsState()) {
    loadAll();
  }

  Future<void> loadAll() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final news = await _ref.read(newsServiceProvider).getNews(category: state.selectedCategory);
      final trending = await _ref.read(newsServiceProvider).getTrending();
      final briefing = await _ref.read(newsServiceProvider).getDailyBriefing();

      state = state.copyWith(
        newsList: news,
        trendingList: trending,
        dailyBriefing: briefing,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> selectCategory(String category) async {
    state = state.copyWith(selectedCategory: category, isLoading: true);
    try {
      final news = await _ref.read(newsServiceProvider).getNews(category: category);
      state = state.copyWith(newsList: news, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final newsProvider = StateNotifierProvider<NewsNotifier, NewsState>((ref) {
  return NewsNotifier(ref);
});
