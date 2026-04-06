import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _loginController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  String _message = '';

  void _doLogin() async {
    final service = AuthService();
    final res = await service.login(_loginController.text, _passwordController.text);

    if (res['accessToken'] != null) {
      // Success! Navigate to your main page
      Navigator.pushReplacementNamed(context, '/movies');
    } else {
      setState(() {
        _message = res['error'] ?? 'Login failed';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Movie Login")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(controller: _loginController, decoration: const InputDecoration(labelText: "Username")),
            TextField(controller: _passwordController, decoration: const InputDecoration(labelText: "Password"), obscureText: true),
            const SizedBox(height: 20),
            ElevatedButton(onPressed: _doLogin, child: const Text("Login")),
            TextButton(onPressed: () => Navigator.pushNamed(context, '/register'), child: const Text("Don't have an account? Register here")),
            Text(_message, style: const TextStyle(color: Colors.red)),
          ],
        ),
      ),
    );
  }
}