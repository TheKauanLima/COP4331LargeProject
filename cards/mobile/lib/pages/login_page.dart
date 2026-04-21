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
    // Allows the gradient to start from the very top of the screen
    extendBodyBehindAppBar: true, 
    appBar: AppBar(
      title: const Text("FilmBuff Login", style: TextStyle(color: Colors.white)),
      backgroundColor: Colors.transparent,
      elevation: 0,
    ),
    body: Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color.fromARGB(255, 90, 121, 125), // Your custom lighter teal
            Color(0xFF1A2627),                 // Your deep charcoal
          ],
        ),
      ),
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Your custom PNG logo
                Image.asset(
                  'assets/FB.png', 
                  height: 180, 
                  width: 180,  
                  fit: BoxFit.contain, 
                ),
                const SizedBox(height: 30),
                
                // Username Field
                TextField(
                  controller: _loginController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: "Username",
                    labelStyle: TextStyle(color: Colors.white70),
                    enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white)),
                    focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFB2D3D2))),
                  ),
                ),
                
                const SizedBox(height: 10),

                // Password Field
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: "Password",
                    labelStyle: TextStyle(color: Colors.white70),
                    enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white)),
                    focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFB2D3D2))),
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
                          backgroundColor: const Color(0xFFB2D3D2), // Matching card teal
                          foregroundColor: Colors.black, // Black text on teal button
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 15),
                        ),
                        onPressed: _doLogin, 
                        child: const Text("LOGIN", style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                
                const SizedBox(height: 15),

                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/register'), 
                  child: const Text(
                    "Don't have an account? Register here",
                    style: TextStyle(color: Colors.white70),
                  ),
                ),

                TextButton(
                  onPressed: () {
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
    ),
  );
}
}