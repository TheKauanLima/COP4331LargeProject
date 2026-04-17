import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/path_helper.dart';

class AuthService {
  Future<Map<String, dynamic>> login(String login, String password) async {
    final url = Uri.parse(PathHelper.buildPath('api/login'));
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'login': login, 'password': password}),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String login,
    required String password,
  }) async {
    final url = Uri.parse(PathHelper.buildPath('api/register'));
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'login': login,
        'password': password,
      }),
    );

    return jsonDecode(response.body);
  }
  Future<Map<String, dynamic>> verifyEmail(String email, String code) async {
    final url = Uri.parse(PathHelper.buildPath('api/verify-email'));
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'verificationCode': code}),
    );

    return jsonDecode(response.body);
  }
}