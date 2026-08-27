import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/moderation_model.dart';
import 'app_providers.dart';

class ModerationState {
  final Map<String, dynamic> stats;
  final List<ModerationItemModel> queue;
  final List<Map<String, dynamic>> sources;
  final String activeStatusFilter;
  final bool isLoading;
  final String? error;

  ModerationState({
    this.stats = const {},
    this.queue = const [],
    this.sources = const [],
    this.activeStatusFilter = 'pending',
    this.isLoading = false,
    this.error,
  });

  ModerationState copyWith({
    Map<String, dynamic>? stats,
    List<ModerationItemModel>? queue,
    List<Map<String, dynamic>>? sources,
    String? activeStatusFilter,
    bool? isLoading,
    String? error,
  }) {
    return ModerationState(
      stats: stats ?? this.stats,
      queue: queue ?? this.queue,
      sources: sources ?? this.sources,
      activeStatusFilter: activeStatusFilter ?? this.activeStatusFilter,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ModerationNotifier extends StateNotifier<ModerationState> {
  final Ref _ref;

  ModerationNotifier(this._ref) : super(ModerationState()) {
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final stats = await _ref.read(moderationServiceProvider).getStats();
      final queue = await _ref.read(moderationServiceProvider).getQueue(status: state.activeStatusFilter);
      final sources = await _ref.read(moderationServiceProvider).getSources();

      state = state.copyWith(
        stats: stats,
        queue: queue,
        sources: sources,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> filterQueue(String status) async {
    state = state.copyWith(activeStatusFilter: status, isLoading: true);
    try {
      final queue = await _ref.read(moderationServiceProvider).getQueue(status: status);
      state = state.copyWith(queue: queue, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> reviewItem(String id, {required String action, required String notes, String? finalVerdict}) async {
    try {
      await _ref.read(moderationServiceProvider).reviewItem(
            id,
            action: action,
            notes: notes,
            finalVerdict: finalVerdict,
          );
      await loadDashboard();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}

final moderationProvider = StateNotifierProvider<ModerationNotifier, ModerationState>((ref) {
  return ModerationNotifier(ref);
});
