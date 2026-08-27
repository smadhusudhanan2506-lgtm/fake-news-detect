import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/analysis_model.dart';
import 'app_providers.dart';

class HistoryState {
  final List<AnalysisModel> items;
  final String activeFilter; // 'all' | 'verified' | 'false' | 'misleading' | 'unverifiable'
  final String searchQuery;
  final bool isLoading;
  final String? error;

  HistoryState({
    this.items = const [],
    this.activeFilter = 'all',
    this.searchQuery = '',
    this.isLoading = false,
    this.error,
  });

  HistoryState copyWith({
    List<AnalysisModel>? items,
    String? activeFilter,
    String? searchQuery,
    bool? isLoading,
    String? error,
  }) {
    return HistoryState(
      items: items ?? this.items,
      activeFilter: activeFilter ?? this.activeFilter,
      searchQuery: searchQuery ?? this.searchQuery,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class HistoryNotifier extends StateNotifier<HistoryState> {
  final Ref _ref;

  HistoryNotifier(this._ref) : super(HistoryState()) {
    loadHistory();
  }

  Future<void> loadHistory() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final items = await _ref.read(verificationServiceProvider).getHistory(
            verdict: state.activeFilter,
            search: state.searchQuery,
          );
      state = state.copyWith(items: items, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> setFilter(String filter) async {
    state = state.copyWith(activeFilter: filter);
    await loadHistory();
  }

  Future<void> search(String query) async {
    state = state.copyWith(searchQuery: query);
    await loadHistory();
  }

  Future<void> deleteItem(String id) async {
    try {
      await _ref.read(verificationServiceProvider).deleteHistory(id);
      state = state.copyWith(items: state.items.where((i) => i.id != id).toList());
    } catch (_) {}
  }
}

final historyProvider = StateNotifierProvider<HistoryNotifier, HistoryState>((ref) {
  return HistoryNotifier(ref);
});
