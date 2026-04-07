import 'package:flutter/material.dart';

class MovieHomePage extends StatefulWidget {
  @override
  _MovieHomePageState createState() => _MovieHomePageState();
}

class _MovieHomePageState extends State<MovieHomePage> {
  bool showSaved = true; // State to toggle between sections

  void _handleLogout(BuildContext context) {
  // If we later save a JWT token or User ID in a "Global State"
  
  Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF435B5E), // Background color
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text("FilmBuffs", style: TextStyle(color: Colors.white)),
        actions: [
  PopupMenuButton<String>(
    onSelected: (value) {
      if (value == 'logout') {
        _handleLogout(context);
      }
    },
    icon: const Icon(Icons.account_circle, size: 35, color: Colors.white),
    itemBuilder: (BuildContext context) {
      return [
        const PopupMenuItem<String>(
          value: 'logout',
          child: Row(
            children: [
              Icon(Icons.logout, color: Colors.black),
              SizedBox(width: 10),
              Text('Logout', style: TextStyle(color: Colors.black)),
            ],
          ),
        ),
      ];
    },
  ),
],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: TextField(
              decoration: InputDecoration(
                fillColor: Colors.white,
                filled: true,
                hintText: 'Search',
                suffixIcon: Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
          
          const SizedBox(height: 20),

          //Toggle Pill
          Container(
            width: 300,
            decoration: BoxDecoration(
              color: Color(0xFFE8F5E9), // Light green ish background
              borderRadius: BorderRadius.circular(30),
            ),
            child: Row(
              children: [
                _toggleButton("My Saved Movies", Icons.bookmark, showSaved, () => setState(() => showSaved = true)),
                _toggleButton("Recommended", null, !showSaved, () => setState(() => showSaved = false)),
              ],
            ),
          ),

          const SizedBox(height: 20),

          //Saved Movies Grid
          Expanded(
            child: GridView.builder(
              padding: EdgeInsets.all(16),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.75,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: 4, // Placeholder count
              itemBuilder: (context, index) {
                return MovieCard();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _toggleButton(String text, IconData? icon, bool isActive, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isActive ? Color(0xFFB2D3D2) : Colors.transparent,
            borderRadius: BorderRadius.circular(30),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) Icon(icon, size: 18),
              if (icon != null) SizedBox(width: 5),
              Text(text, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }
}

class MovieCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Color(0xFFB2D3D2), // Card background
        borderRadius: BorderRadius.circular(20),
      ),
      padding: EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
              ),
              child: Icon(Icons.camera_alt_outlined, size: 50, color: Colors.grey),
            ),
          ),
          const SizedBox(height: 8),
          Text("Movie Title", style: TextStyle(fontWeight: FontWeight.bold)),
          Text("Year", style: TextStyle(fontSize: 12)),
          Row(
            children: List.generate(3, (index) => Icon(Icons.star_border, size: 16, color: Colors.black)),
          ),
        ],
      ),
    );
  }
}