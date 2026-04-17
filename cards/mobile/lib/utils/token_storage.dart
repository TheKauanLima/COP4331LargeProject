import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart'; // This provides debugPrint

class TokenStorage {
  /// Equivalent to your React 'storeToken' function
  static Future<void> storeToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // We use 'token_data' to match your web app's key
      await prefs.setString('token_data', token);
    } catch (e) {
      debugPrint('Error storing token: $e');
    }
  }

  /// Equivalent to your React 'retrieveToken' function
  static Future<String?> retrieveToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('token_data');
    } catch (e) {
      debugPrint('Error retrieving token: $e');
      return null;
    }
  }

  /// Helper to clear the token (useful for Logout)
  static Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token_data');
  }
}