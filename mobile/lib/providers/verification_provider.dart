import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/analysis_model.dart';
import 'app_providers.dart';

class VerificationState {
  final bool isVerifying;
  final String currentStage;
  final double progressPercent;
  final AnalysisModel? result;
  final String? error;

  VerificationState({
    this.isVerifying = false,
    this.currentStage = '',
    this.progressPercent = 0.0,
    this.result,
    this.error,
  });

  VerificationState copyWith({
    bool? isVerifying,
    String? currentStage,
    double? progressPercent,
    AnalysisModel? result,
    String? error,
  }) {
    return VerificationState(
      isVerifying: isVerifying ?? this.isVerifying,
      currentStage: currentStage ?? this.currentStage,
      progressPercent: progressPercent ?? this.progressPercent,
      result: result ?? this.result,
      error: error,
    );
  }
}

class VerificationNotifier extends StateNotifier<VerificationState> {
  final Ref _ref;

  VerificationNotifier(this._ref) : super(VerificationState());

  Future<AnalysisModel?> verifyText(String text, {String inputType = 'text', bool skipCache = false}) async {
    return _runPipeline(() => _ref.read(verificationServiceProvider).verifyText(text, inputType: inputType, skipCache: skipCache));
  }

  Future<AnalysisModel?> verifyUrl(String url, {bool skipCache = false}) async {
    return _runPipeline(() => _ref.read(verificationServiceProvider).verifyUrl(url, skipCache: skipCache));
  }

  Future<AnalysisModel?> verifyImage(Uint8List bytes, String filename, {String inputType = 'screenshot'}) async {
    return _runPipeline(() => _ref.read(verificationServiceProvider).verifyImageBytes(bytes, filename, inputType: inputType));
  }

  Future<AnalysisModel?> verifyVideo(Uint8List bytes, String filename) async {
    return _runPipeline(() => _ref.read(verificationServiceProvider).verifyVideoBytes(bytes, filename));
  }

  Future<AnalysisModel?> verifyShare(String content) async {
    return _runPipeline(() => _ref.read(verificationServiceProvider).verifyShare(content));
  }

  Future<AnalysisModel?> _runPipeline(Future<AnalysisModel> Function() apiCall) async {
    state = state.copyWith(isVerifying: true, currentStage: 'Reading content...', progressPercent: 0.15, error: null);

    try {
      // Simulate animated stages while network request runs
      Future.delayed(const Duration(milliseconds: 300), () {
        if (state.isVerifying) {
          state = state.copyWith(currentStage: 'Extracting claims...', progressPercent: 0.35);
        }
      });

      Future.delayed(const Duration(milliseconds: 600), () {
        if (state.isVerifying) {
          state = state.copyWith(currentStage: 'Searching fact-check sources...', progressPercent: 0.60);
        }
      });

      Future.delayed(const Duration(milliseconds: 900), () {
        if (state.isVerifying) {
          state = state.copyWith(currentStage: 'Comparing evidence & AI reasoning...', progressPercent: 0.85);
        }
      });

      final model = await apiCall();

      state = state.copyWith(
        isVerifying: false,
        currentStage: 'Verification complete.',
        progressPercent: 1.0,
        result: model,
      );

      return model;
    } catch (e) {
      state = state.copyWith(isVerifying: false, error: e.toString());
      return null;
    }
  }

  void reset() {
    state = VerificationState();
  }
}

final verificationProvider = StateNotifierProvider<VerificationNotifier, VerificationState>((ref) {
  return VerificationNotifier(ref);
});
