import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../utils/path_helper.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _loginController = TextEditingController();
  final _passwordController = TextEditingController();

 void _doRegister() async {
  final res = await AuthService().register(
    firstName: _firstNameController.text,
    lastName: _lastNameController.text,
    email: _emailController.text,
    login: _loginController.text,
    password: _passwordController.text,
  );

  if (!mounted) return;

  if (res['error'] == null || res['error'] == "") {
    //Show a message instead of a code dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Check Your Email"),
        content: const Text("We've sent a verification link to your email. Please click it to activate your account."),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Back to Login
            },
            child: const Text("OK"),
          )
        ],
      ),
    );
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(res['error'])),
    );
  }
}

  void _showVerifyDialog() {
    final codeController = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text("Verify Email"),
        content: TextField(
          controller: codeController,
          decoration: const InputDecoration(hintText: "Enter 6-digit code"),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              final res = await AuthService().verifyEmail(_emailController.text, codeController.text);
              if (res['error'] == null || res['error'] == "") {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back to Login
              }
            },
            child: const Text("Verify"),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Create Account")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView( //Prevents keyboard overlap
          child: Column(
            children: [
              TextField(controller: _firstNameController, decoration: const InputDecoration(labelText: "First Name")),
              TextField(controller: _lastNameController, decoration: const InputDecoration(labelText: "Last Name")),
              TextField(controller: _emailController, decoration: const InputDecoration(labelText: "Email")),
              TextField(controller: _loginController, decoration: const InputDecoration(labelText: "Username")),
              TextField(controller: _passwordController, decoration: const InputDecoration(labelText: "Password"), obscureText: true),
              const SizedBox(height: 20),
              ElevatedButton(onPressed: _doRegister, child: const Text("Register")),
            ],
          ),
        ),
      ),
    );
  }
}