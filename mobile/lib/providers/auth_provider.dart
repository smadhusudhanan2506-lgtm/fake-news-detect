import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/app_constants.dart';
import '../models/user_model.dart';
import 'app_providers.dart';

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref _ref;

  AuthNotifier(this._ref) : super(AuthState()) {
    checkInitialAuth();
  }

  Future<void> checkInitialAuth() async {
    state = state.copyWith(isLoading: true);
    final storage = _ref.read(storageServiceProvider);
    final token = await storage.getString(AppConstants.keyAuthToken);

    if (token != null && token.isNotEmpty) {
      final user = await _ref.read(authServiceProvider).getMe();
      if (user != null) {
        state = state.copyWith(user: user, isAuthenticated: true, isLoading: false);
        return;
      }
    }

    // Default fallback demo user for out-of-the-box local testing
    state = state.copyWith(
      user: UserModel(
        id: 'user_regular_1',
        name: 'Aditi Sharma',
        email: 'aditi@example.com',
        role: 'user',
      ),
      isAuthenticated: true,
      isLoading: false,
    );
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _ref.read(authServiceProvider).login(email: email, password: password);
      state = state.copyWith(user: user, isAuthenticated: true, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> register(String name, String email, String password, {String? phone, String role = 'user'}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _ref.read(authServiceProvider).register(
            name: name,
            email: email,
            password: password,
            phone: phone,
            role: role,
          );
      state = state.copyWith(user: user, isAuthenticated: true, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> switchRole(String role) async {
    state = state.copyWith(isLoading: true);
    try {
      final user = await _ref.read(authServiceProvider).switchDemoRole(role);
      state = state.copyWith(user: user, isAuthenticated: true, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> logout() async {
    await _ref.read(authServiceProvider).logout();
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});

// Theme Mode Provider
class ThemeNotifier extends StateNotifier<ThemeMode> {
  final Ref _ref;

  ThemeNotifier(this._ref) : super(ThemeMode.system) {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final storage = _ref.read(storageServiceProvider);
    final saved = await storage.getString(AppConstants.keyThemeMode);
    if (saved == 'light') state = ThemeMode.light;
    if (saved == 'dark') state = ThemeMode.dark;
  }

  Future<void> setTheme(ThemeMode mode) async {
    state = mode;
    final storage = _ref.read(storageServiceProvider);
    await storage.setString(
      AppConstants.keyThemeMode,
      mode == ThemeMode.light ? 'light' : (mode == ThemeMode.dark ? 'dark' : 'system'),
    );
  }
}

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  return ThemeNotifier(ref);
});
