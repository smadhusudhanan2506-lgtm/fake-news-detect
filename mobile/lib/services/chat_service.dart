import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../core/constants/api_endpoints.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../models/chat_message_model.dart';
import 'storage_service.dart';

class ChatService {
  final ApiClient _apiClient;
  final StorageService _storageService;
  IO.Socket? _socket;

  ChatService({
    required ApiClient apiClient,
    required StorageService storageService,
  })  : _apiClient = apiClient,
        _storageService = storageService;

  Future<ChatMessageModel> sendMessageRest({
    required String message,
    String? conversationId,
    String mode = 'general',
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.chatMessage,
      data: {
        'message': message,
        'conversationId': conversationId,
        'mode': mode,
      },
    );
    return ChatMessageModel.fromJson(response.data['message']);
  }

  void connectSocket({
    required Function(String chunk, String fullContent) onChunk,
    required Function(ChatMessageModel message) onComplete,
    required Function(bool isTyping) onTyping,
    required Function(String error) onError,
  }) async {
    final token = await _storageService.getString(AppConstants.keyAuthToken);

    _socket = IO.io(
      ApiEndpoints.wsUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setExtraHeaders({'Authorization': 'Bearer ${token ?? ""}'})
          .build(),
    );

    _socket?.connect();

    _socket?.onConnect((_) {
      _socket?.emit('authenticate', {'token': token});
    });

    _socket?.on('typing', (data) {
      onTyping(data['isTyping'] ?? false);
    });

    _socket?.on('response_chunk', (data) {
      onChunk(data['chunk'] ?? '', data['fullContent'] ?? '');
    });

    _socket?.on('response_complete', (data) {
      onComplete(ChatMessageModel.fromJson(data['message']));
    });

    _socket?.on('error', (data) {
      onError(data['message'] ?? 'Chat socket error');
    });
  }

  void sendSocketMessage(String message, {String? conversationId, String mode = 'general'}) {
    _socket?.emit('message', {
      'message': message,
      'conversationId': conversationId,
      'mode': mode,
    });
  }

  void disconnectSocket() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
