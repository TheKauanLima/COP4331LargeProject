import 'package:flutter/material.dart';
import '../services/movie_service.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'forgot_password_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _loginController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoggingIn = false; // Added to show a spinner during API call


void _doLogin() async {
  setState(() => _isLoggingIn = true);

  final result = await MovieService().login(
    _loginController.text, 
    _passwordController.text
  );

  if (!mounted) return;
  setState(() => _isLoggingIn = false);

  if (result['accessToken'] != null) {
    // 1. Decode the token to get the payload
    Map<String, dynamic> decodedToken = JwtDecoder.decode(result['accessToken']);
    
    // 2. Extract the userId (In your log, it shows "userId": 20)
    String userId = decodedToken['userId'].toString(); 
    
    // 3. (Optional) Save the token for future authorized searches
    // await TokenStorage.saveToken(result['accessToken']);

    Navigator.pushReplacementNamed(
      context, 
      '/movies', 
      arguments: {
    'userId': userId,
    'token': result['accessToken'] // Pass the token here
  },
    );
  } else {
    String errorMsg = result['error'] ?? "Login failed. Check your credentials.";
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errorMsg)));
  }
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF435B5E), // Match your home page theme
      appBar: AppBar(
        title: const Text("FilmBuff Login", style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Center(
          child: SingleChildScrollView(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.movie_filter, size: 80, color: Colors.white),
                const SizedBox(height: 30),
                
                // Username Field
                TextField(
                  controller: _loginController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: "Username",
                    labelStyle: TextStyle(color: Colors.white70),
                    enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white)),
                  ),
                ),
                
                // Password Field
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: "Password",
                    labelStyle: TextStyle(color: Colors.white70),
                    enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white)),
                  ),
                ),
                
                const SizedBox(height: 40),

                // Login Button / Spinner
                _isLoggingIn 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFB2D3D2),
                          foregroundColor: Colors.black,
                        ),
                        onPressed: _doLogin, 
                        child: const Text("LOGIN"),
                      ),
                    ),
                
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/register'), 
                  child: const Text(
                    "Don't have an account? Register here",
                    style: TextStyle(color: Colors.white70),
                  ),
                ),

                // Underneath your "Create Account" button container
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () {
                    // Navigate to the Forgot Password Page
                   Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const ForgotPasswordPage()),
                    );
                  },
                  child: const Text(
                    "Forgot Password?",
                    style: TextStyle(
                      color: Colors.white70, 
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}