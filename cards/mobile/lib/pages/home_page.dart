import 'package:flutter/material.dart';
import '../services/movie_service.dart';
import '../utils/token_storage.dart';

class MovieHomePage extends StatefulWidget {
  const MovieHomePage({super.key});

  @override
  _MovieHomePageState createState() => _MovieHomePageState();
}

class _MovieHomePageState extends State<MovieHomePage> {
  // 1. Define variables once
  late String userId;
  late String jwtToken;
  bool isInitialized = false; // To prevent double-loading

  bool showSaved = true;
  List<dynamic> savedMovies = [];
  List<dynamic> watchedMovies = [];
  List<dynamic> searchResults = []; // List to hold search results
  bool isSearching = false; // To toggle between saved/watched and search results
  bool isLoading = true;

  final TextEditingController _searchController = TextEditingController();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    // 2. Extract arguments correctly once
    if (!isInitialized) {
      final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
      userId = args['userId'].toString();
      jwtToken = args['token'];
      isInitialized = true;
      _loadData(); // Load initial watchlist
    }
  }

Future<void> _loadData() async {
  setState(() => isLoading = true);
  final data = await MovieService().getUserWatchlist(userId, jwtToken);
setState(() {
  // Use 'watchList' with a capital L to match your React code
  savedMovies = data['watchList'] ?? []; 
});
  
  // ADD THIS PRINT LINE:
  print("FULL USER DATA FROM SERVER: $data");

  if (mounted) {
    setState(() {
      // Update these keys based on what the print statement shows!
      savedMovies = data['watchList'] ?? []; 
      isLoading = false;
    });
  }
}

  // 3. Renamed to _onSearch to match your TextField call
// Inside _MovieHomePageState in home_page.dart
void _onSearch(String query) async {
  if (query.trim().length < 2) return;

  setState(() {
    isLoading = true;
    isSearching = true;
  });

  // Pass all 3: userId, query, and jwtToken
  final response = await MovieService().searchMovies(userId, query, jwtToken);

  if (mounted) {
    setState(() {
      // Your React code showed results are inside the 'results' key
      searchResults = response['results'] ?? [];
      isLoading = false;
    });
  }
}

  void _handleLogout(BuildContext context) async {
    await TokenStorage.clearToken();
    Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    // Determine which list to show: Search results take priority if searching
    List<dynamic> currentList;
    if (isSearching) {
      currentList = searchResults;
    } else {
      currentList = showSaved ? savedMovies : watchedMovies;
    }

    return Scaffold(
      backgroundColor: const Color(0xFF435B5E),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text("FilmBuffs", style: TextStyle(color: Colors.white)),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) => value == 'logout' ? _handleLogout(context) : null,
            icon: const Icon(Icons.account_circle, size: 35, color: Colors.white),
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'logout', child: Text("Logout")),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                fillColor: Colors.white,
                filled: true,
                hintText: 'Search movies...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    _onSearch(""); // Reset search
                  },
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onSubmitted: (value) => _onSearch(value),
            ),
          ),
          const SizedBox(height: 20),
          if (!isSearching) _buildTogglePill(), // Only show toggle if not searching
          if (isSearching) 
            const Text("Search Results", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: Colors.white))
                : _buildGrid(currentList),
          ),
        ],
      ),
    );
  }

  Widget _buildTogglePill() {
    return Container(
      width: 320,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5E9),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        children: [
          _toggleButton("My Saved Movies", showSaved, () => setState(() => showSaved = true)),
          _toggleButton("Recommended", !showSaved, () => setState(() => showSaved = false)),
        ],
      ),
    );
  }

  Widget _toggleButton(String text, bool isActive, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFFB2D3D2) : Colors.transparent,
            borderRadius: BorderRadius.circular(30),
          ),
          child: Center(
            child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
    );
  }

  Widget _buildGrid(List<dynamic> list) {
    if (list.isEmpty) {
      return const Center(child: Text("No movies found", style: TextStyle(color: Colors.white70)));
    }
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2, 
        childAspectRatio: 0.75, 
        crossAxisSpacing: 16, 
        mainAxisSpacing: 16,
      ),
      itemCount: list.length,
      itemBuilder: (context, index) => MovieCard(movieData: list[index]),
    );
  }
}

class MovieCard extends StatelessWidget {
  final dynamic movieData;
  const MovieCard({super.key, this.movieData});

  @override
  Widget build(BuildContext context) {
    // 1. Safely get the Title
    String title = movieData['title'] ?? movieData['Card'] ?? "Unknown Movie";
    
    // 2. Safely get the Poster
    String? posterPath = movieData['poster_path'];
    String imageUrl = "https://image.tmdb.org/t/p/w500$posterPath";

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFB2D3D2),
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Expanded(
            child: posterPath != null && posterPath.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.network(imageUrl, fit: BoxFit.cover),
                  )
                : const Icon(Icons.movie, size: 50, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          // Show the year if it exists
          if (movieData['release_date'] != null && movieData['release_date'].toString().length >= 4)
  Text(
    movieData['release_date'].toString().substring(0, 4),
    style: const TextStyle(fontSize: 10, color: Colors.black54),
  )
else if (movieData['release_date'] != null && movieData['release_date'].toString().isNotEmpty)
  Text(
    movieData['release_date'].toString(), // Just show whatever is there if it's short
    style: const TextStyle(fontSize: 10, color: Colors.black54),
  ),
        ],
      ),
    );
  }
}