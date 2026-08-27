import '../core/constants/api_endpoints.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../models/user_model.dart';
import 'storage_service.dart';

class AuthService {
  final ApiClient _apiClient;
  final StorageService _storageService;

  AuthService({
    required ApiClient apiClient,
    required StorageService storageService,
  })  : _apiClient = apiClient,
        _storageService = storageService;

  Future<UserModel> register({
    required String name,
    required String email,
    String? phone,
    required String password,
    String role = 'user',
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.register,
      data: {
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
        'role': role,
      },
    );

    final data = response.data['data'];
    final token = data['token'];
    await _storageService.setString(AppConstants.keyAuthToken, token);
    await _storageService.setString(AppConstants.keyUserRole, role);

    return UserModel.fromJson(data['user']);
  }

  Future<UserModel> login({required String email, required String password}) async {
    final response = await _apiClient.post(
      ApiEndpoints.login,
      data: {'email': email, 'password': password},
    );

    final data = response.data['data'];
    final token = data['token'];
    final user = UserModel.fromJson(data['user']);

    await _storageService.setString(AppConstants.keyAuthToken, token);
    await _storageService.setString(AppConstants.keyUserRole, user.role);

    return user;
  }

  Future<UserModel?> getMe() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.me);
      return UserModel.fromJson(response.data['data']['user']);
    } catch (_) {
      return null;
    }
  }

  Future<UserModel> switchDemoRole(String role) async {
    final response = await _apiClient.post(
      ApiEndpoints.demoSwitch,
      data: {
        'role': role,
        'name': role == 'moderator' ? 'Vikram Mehta (Moderator)' : 'Demo User',
        'email': '$role@factcheck.ai',
      },
    );

    final data = response.data['data'];
    await _storageService.setString(AppConstants.keyAuthToken, data['token']);
    await _storageService.setString(AppConstants.keyUserRole, role);

    return UserModel.fromJson(data['user']);
  }

  Future<void> logout() async {
    await _storageService.remove(AppConstants.keyAuthToken);
    await _storageService.remove(AppConstants.keyUserRole);
  }
}
