import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../models/chat_message_model.dart';
import '../../providers/app_providers.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/verdict_badge.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isListening = false;

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleSend() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    _textController.clear();
    _scrollToBottom();

    await ref.read(chatProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  Future<void> _toggleVoiceInput() async {
    final ttsVoice = ref.read(ttsVoiceServiceProvider);

    if (_isListening) {
      await ttsVoice.stopListening();
      setState(() => _isListening = false);
    } else {
      setState(() => _isListening = true);
      await ttsVoice.startListening(
        onResult: (spokenText) {
          setState(() {
            _textController.text = spokenText;
          });
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final chatState = ref.watch(chatProvider);
    final ttsVoice = ref.watch(ttsVoiceServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('FactCheck AI Assistant'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'New Conversation',
            onPressed: () => ref.read(chatProvider.notifier).clearConversation(),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Mode Selector Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                border: Border(bottom: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.lightBorder)),
              ),
              child: Row(
                children: [
                  _buildModeChip('general', '🤖 General', chatState.activeMode, isDark),
                  const SizedBox(width: 8),
                  _buildModeChip('news', '📰 News Query', chatState.activeMode, isDark),
                  const SizedBox(width: 8),
                  _buildModeChip('verification', '🔍 News Verify', chatState.activeMode, isDark),
                ],
              ),
            ),

            // Chat Messages List
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: chatState.messages.length + (chatState.isTyping ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == chatState.messages.length && chatState.isTyping) {
                    return _buildTypingIndicator(isDark);
                  }

                  final msg = chatState.messages[index];
                  return _buildMessageBubble(msg, isDark, ttsVoice);
                },
              ),
            ),

            // Message Input Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                border: Border(top: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.lightBorder)),
              ),
              child: Row(
                children: [
                  // Voice Input Button
                  IconButton(
                    icon: Icon(
                      _isListening ? Icons.mic : Icons.mic_none_rounded,
                      color: _isListening ? AppColors.falseRed : AppColors.primary,
                    ),
                    onPressed: _toggleVoiceInput,
                  ),

                  // Text Field
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      maxLines: 4,
                      minLines: 1,
                      decoration: InputDecoration(
                        hintText: chatState.activeMode == 'verification'
                            ? 'Ask to verify a claim or rumor...'
                            : (chatState.activeMode == 'news'
                                ? 'Ask about current events & news...'
                                : 'Ask anything...'),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onSubmitted: (_) => _handleSend(),
                    ),
                  ),

                  // Send Button
                  IconButton(
                    icon: const Icon(Icons.send_rounded, color: AppColors.primary),
                    onPressed: _handleSend,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeChip(String modeKey, String label, String activeMode, bool isDark) {
    final isSelected = activeMode == modeKey;

    return ChoiceChip(
      label: Text(label, style: TextStyle(fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87))),
      selected: isSelected,
      selectedColor: modeKey == 'verification'
          ? AppColors.verifiedGreen
          : (modeKey == 'news' ? AppColors.secondary : AppColors.primary),
      backgroundColor: isDark ? AppColors.darkSurfaceVariant : AppColors.lightSurfaceVariant,
      onSelected: (_) => ref.read(chatProvider.notifier).setMode(modeKey),
    );
  }

  Widget _buildMessageBubble(ChatMessageModel msg, bool isDark, dynamic ttsVoice) {
    if (msg.isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: Container(
          margin: const EdgeInsets.only(bottom: 12, left: 48),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(18).copyWith(bottomRight: const Radius.circular(2)),
          ),
          child: Text(
            msg.content,
            style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.4),
          ),
        ),
      );
    }

    // Assistant Message Bubble
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16, right: 32),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: BorderRadius.circular(18).copyWith(bottomLeft: const Radius.circular(2)),
          border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Verdict Badge if in verification
            if (msg.verdict != null) ...[
              VerdictBadge(verdict: msg.verdict!),
              const SizedBox(height: 10),
            ],

            // Markdown Message Content
            MarkdownBody(
              data: msg.content,
              styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
                p: AppTextStyles.bodyMedium(isDark).copyWith(fontSize: 14.5, height: 1.5),
                code: TextStyle(
                  backgroundColor: isDark ? AppColors.darkSurfaceVariant : AppColors.lightSurfaceVariant,
                  fontFamily: 'monospace',
                  fontSize: 13,
                ),
              ),
            ),

            // Sources Cited
            if (msg.sources.isNotEmpty) ...[
              const SizedBox(height: 12),
              Divider(height: 1, color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
              const SizedBox(height: 8),
              Text(
                'Sources:',
                style: AppTextStyles.labelSmall(isDark).copyWith(fontWeight: FontWeight.bold),
              ),
              ...msg.sources.map(
                (src) => Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Row(
                    children: [
                      const Icon(Icons.link_rounded, size: 14, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '${src.sourceName}: ${src.title}',
                          style: AppTextStyles.labelSmall(isDark).copyWith(color: AppColors.primary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // Action Toolbar (TTS, Copy, Share)
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  icon: const Icon(Icons.volume_up_rounded, size: 18),
                  tooltip: 'Listen (TTS)',
                  onPressed: () => ttsVoice.speak(msg.content),
                ),
                IconButton(
                  icon: const Icon(Icons.copy_rounded, size: 18),
                  tooltip: 'Copy',
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: msg.content));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied to clipboard.')));
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.share_rounded, size: 18),
                  tooltip: 'Share',
                  onPressed: () => Share.share(msg.content),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypingIndicator(bool isDark) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: 10),
            Text(
              'FactCheck AI is synthesizing evidence...',
              style: AppTextStyles.labelSmall(isDark).copyWith(fontStyle: FontStyle.italic),
            ),
          ],
        ),
      ),
    );
  }
}
