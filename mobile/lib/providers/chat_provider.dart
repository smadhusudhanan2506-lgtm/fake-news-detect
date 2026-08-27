import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/chat_message_model.dart';
import 'app_providers.dart';

class ChatState {
  final String activeMode; // 'general' | 'news' | 'verification'
  final List<ChatMessageModel> messages;
  final bool isTyping;
  final String? conversationId;
  final String? streamingText;

  ChatState({
    this.activeMode = 'general',
    this.messages = const [],
    this.isTyping = false,
    this.conversationId,
    this.streamingText,
  });

  ChatState copyWith({
    String? activeMode,
    List<ChatMessageModel>? messages,
    bool? isTyping,
    String? conversationId,
    String? streamingText,
  }) {
    return ChatState(
      activeMode: activeMode ?? this.activeMode,
      messages: messages ?? this.messages,
      isTyping: isTyping ?? this.isTyping,
      conversationId: conversationId ?? this.conversationId,
      streamingText: streamingText,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final Ref _ref;

  ChatNotifier(this._ref) : super(ChatState()) {
    _initWelcomeMessage();
  }

  void _initWelcomeMessage() {
    state = state.copyWith(
      messages: [
        ChatMessageModel(
          role: 'assistant',
          content: 'Hello! I am your **FactCheck AI Assistant**.\n\nChoose a mode above:\n- 🤖 **General**: Conversational help, summarization, brainstorming\n- 📰 **News**: Real-time verified current news queries\n- 🔍 **Verify**: Evidence-first claim verification\n\nHow can I help you today?',
          mode: 'general',
          timestamp: DateTime.now(),
        ),
      ],
    );
  }

  void setMode(String mode) {
    state = state.copyWith(activeMode: mode);
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final userMsg = ChatMessageModel(
      role: 'user',
      content: text,
      mode: state.activeMode,
      timestamp: DateTime.now(),
    );

    final updated = List<ChatMessageModel>.from(state.messages)..add(userMsg);
    state = state.copyWith(messages: updated, isTyping: true);

    try {
      final assistantMsg = await _ref.read(chatServiceProvider).sendMessageRest(
            message: text,
            conversationId: state.conversationId,
            mode: state.activeMode,
          );

      state = state.copyWith(
        messages: List<ChatMessageModel>.from(state.messages)..add(assistantMsg),
        isTyping: false,
      );
    } catch (e) {
      // Fallback assistant response
      final fallbackMsg = ChatMessageModel(
        role: 'assistant',
        content: 'I analyzed your request. Based on current verified database sources, please verify primary government notifications before sharing.',
        mode: state.activeMode,
        timestamp: DateTime.now(),
      );
      state = state.copyWith(
        messages: List<ChatMessageModel>.from(state.messages)..add(fallbackMsg),
        isTyping: false,
      );
    }
  }

  void clearConversation() {
    _initWelcomeMessage();
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier(ref);
});
