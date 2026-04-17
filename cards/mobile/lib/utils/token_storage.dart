import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart'; // This provides debugPrint

class TokenStorage {
  static const String _key = 'token_data';

  static Future<void> storeToken(dynamic tok) async {
    final prefs = await SharedPreferences.getInstance();
    String? tokenValue;

    if (tok is String) {
      tokenValue = tok;
    } else if (tok is Map && tok.containsKey('accessToken')) {
      tokenValue = tok['accessToken'];
    }

    if (tokenValue != null && tokenValue.isNotEmpty) {
      await prefs.setString(_key, tokenValue);
    }
  }

  static Future<String?> retrieveToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}