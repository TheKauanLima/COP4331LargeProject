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
    // Allows gradient to go all the way to the top
    extendBodyBehindAppBar: true, 
    appBar: AppBar(
      title: const Text("Create Account", style: TextStyle(color: Colors.white)),
      backgroundColor: Colors.transparent,
      elevation: 0,
      iconTheme: const IconThemeData(color: Colors.white), // Makes back arrow white
    ),
    body: Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color.fromARGB(255, 90, 121, 125), // Your custom light teal
            Color(0xFF1A2627),                 // Your deep charcoal
          ],
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Keep that FB logo consistent here too!
              Image.asset('assets/FB.png', height: 100),
              const SizedBox(height: 30),

              _buildRegField(_firstNameController, "First Name"),
              _buildRegField(_lastNameController, "Last Name"),
              _buildRegField(_emailController, "Email"),
              _buildRegField(_loginController, "Username"),
              _buildRegField(_passwordController, "Password", isObscure: true),

              const SizedBox(height: 30),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFB2D3D2), // Matching light teal
                    foregroundColor: Colors.black,           // Black text for readability
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: _doRegister,
                  child: const Text("REGISTER", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

// Helper to keep the text field code clean and consistent
Widget _buildRegField(TextEditingController controller, String label, {bool isObscure = false}) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 15.0),
    child: TextField(
      controller: controller,
      obscureText: isObscure,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white70),
        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white54)),
        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFB2D3D2))),
      ),
    ),
  );
}
}