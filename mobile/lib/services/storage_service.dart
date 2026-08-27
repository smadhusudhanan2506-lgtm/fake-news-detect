import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<void> setString(String key, String value) async {
    await init();
    await _prefs?.setString(key, value);
  }

  Future<String?> getString(String key) async {
    await init();
    return _prefs?.getString(key);
  }

  Future<void> setBool(String key, bool value) async {
    await init();
    await _prefs?.setBool(key, value);
  }

  Future<bool> getBool(String key, {bool defaultValue = false}) async {
    await init();
    return _prefs?.getBool(key) ?? defaultValue;
  }

  Future<void> remove(String key) async {
    await init();
    await _prefs?.remove(key);
  }

  Future<void> clear() async {
    await init();
    await _prefs?.clear();
  }
}
