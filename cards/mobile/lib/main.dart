import 'package:flutter/material.dart';
import 'pages/login_page.dart';
import 'pages/register_page.dart';
import 'pages/home_page.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false, //hides the red 'Debug' banner
      title: 'Movie App',
      initialRoute: '/',
      theme: ThemeData(
        brightness: Brightness.dark, //Makes text/icons white by default
        scaffoldBackgroundColor: const Color(0xFF435B5E),
        popupMenuTheme: PopupMenuThemeData(
        color: const Color(0xFFB2D3D2), // Matching your card color
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        ),
      ),
      routes: {
        '/': (context) => const LoginPage(),
        '/register': (context) => const RegisterPage(),
        '/movies': (context) => MovieHomePage(), //Send to home page
      },
    );
  }
}
