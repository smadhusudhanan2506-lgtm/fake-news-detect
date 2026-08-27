import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart';

class TtsVoiceService {
  final FlutterTts _flutterTts = FlutterTts();
  final SpeechToText _speechToText = SpeechToText();
  bool _isSpeechInitialized = false;
  bool _isPlaying = false;

  bool get isPlaying => _isPlaying;

  Future<void> init() async {
    try {
      await _flutterTts.setLanguage("en-US");
      await _flutterTts.setSpeechRate(0.5);
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);

      _flutterTts.setCompletionHandler(() {
        _isPlaying = false;
      });

      _isSpeechInitialized = await _speechToText.initialize();
    } catch (_) {}
  }

  Future<void> speak(String text) async {
    try {
      // Strip markdown symbols before speaking
      final clean = text
          .replaceAll(RegExp(r'[*_#`~\[\]]'), '')
          .replaceAll(RegExp(r'https?:\/\/\S+'), 'link');
      _isPlaying = true;
      await _flutterTts.speak(clean);
    } catch (_) {
      _isPlaying = false;
    }
  }

  Future<void> stop() async {
    try {
      await _flutterTts.stop();
      _isPlaying = false;
    } catch (_) {}
  }

  Future<void> startListening({required Function(String text) onResult}) async {
    if (!_isSpeechInitialized) {
      _isSpeechInitialized = await _speechToText.initialize();
    }
    if (_isSpeechInitialized) {
      await _speechToText.listen(
        onResult: (result) {
          onResult(result.recognizedWords);
        },
      );
    }
  }

  Future<void> stopListening() async {
    if (_speechToText.isListening) {
      await _speechToText.stop();
    }
  }
}
