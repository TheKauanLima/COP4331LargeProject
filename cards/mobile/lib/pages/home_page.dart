import 'package:flutter/material.dart';
import '../services/movie_service.dart';
import '../utils/token_storage.dart';

class MovieHomePage extends StatefulWidget {
  const MovieHomePage({super.key});

  @override
  _MovieHomePageState createState() => _MovieHomePageState();
}

class _MovieHomePageState extends State<MovieHomePage> {
  late String userId;
  late String jwtToken;
  bool isInitialized = false;

  bool showSaved = true; 
  List<dynamic> savedMovies = [];
  List<dynamic> recommendedMovies = [];
  List<dynamic> searchResults = [];
  
  bool isSearching = false;
  bool isLoading = true;
  String recommendationsMessage = '';

  final TextEditingController _searchController = TextEditingController();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!isInitialized) {
      final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
      userId = args['userId'].toString();
      jwtToken = args['token'];
      isInitialized = true;
      _loadData(); 
    }
  }

  // --- DATA FETCHING ---

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    final data = await MovieService().getUserWatchlist(userId, jwtToken);
    
    if (mounted) {
      setState(() {
        if (data['error'] != null && data['error'].toString().contains("JWT")) {
          Navigator.pushReplacementNamed(context, '/');
          return;
        }
        savedMovies = data['watchList'] ?? []; 
        isLoading = false;
      });
    }
  }

  Future<void> _fetchRecommendations() async {
    if (recommendedMovies.isNotEmpty) return;

    setState(() => isLoading = true);
    var watchedData = await MovieService().getWatchedMovies(userId, jwtToken);
    List<dynamic> sourceMovies = watchedData['watchedMovies'] ?? [];

    if (sourceMovies.isEmpty) {
      sourceMovies = savedMovies;
    }

    if (sourceMovies.isNotEmpty) {
      var similarData = await MovieService().getSimilarMovies(sourceMovies, jwtToken);
      if (mounted) {
        setState(() {
          recommendedMovies = similarData['results'] ?? [];
          recommendationsMessage = recommendedMovies.isEmpty 
              ? 'No recommendations found yet.' 
              : '';
          isLoading = false;
        });
      }
    } else {
      if (mounted) {
        setState(() {
          recommendationsMessage = 'Add some movies to get recommendations!';
          isLoading = false;
        });
      }
    }
  }

  void _onSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() => isSearching = false);
      return;
    }

    setState(() {
      isLoading = true;
      isSearching = true;
    });

    final response = await MovieService().searchMovies(userId, query, jwtToken);

    if (mounted) {
      setState(() {
        searchResults = response['results'] ?? [];
        isLoading = false;
      });
    }
  }

  void _handleLogout(BuildContext context) async {
    await TokenStorage.clearToken();
    Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
  }

  // --- UI BUILDERS ---

  @override
  Widget build(BuildContext context) {
    List<dynamic> currentList;
    String emptyMessage = "No movies found";

    if (isSearching) {
      currentList = searchResults;
      emptyMessage = "No search results for \"${_searchController.text}\"";
    } else if (showSaved) {
      currentList = savedMovies;
      emptyMessage = "Your watchlist is empty!";
    } else {
      currentList = recommendedMovies;
      emptyMessage = recommendationsMessage;
    }

    return Scaffold(
      backgroundColor: const Color(0xFF435B5E),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text("FilmBuffs", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
                suffixIcon: isSearching 
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => isSearching = false);
                      },
                    )
                  : null,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onSubmitted: (value) => _onSearch(value),
            ),
          ),
          const SizedBox(height: 20),
          if (!isSearching) _buildTogglePill(), 
          const SizedBox(height: 20),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: Colors.white))
                : _buildGrid(currentList, emptyMessage),
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
        color: const Color(0xFFE8F5E9).withOpacity(0.9),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        children: [
          _toggleButton("My Saved Movies", showSaved, () {
            setState(() => showSaved = true);
          }),
          _toggleButton("Recommended", !showSaved, () {
            setState(() => showSaved = false);
            _fetchRecommendations(); 
          }),
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
            child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black,)),
          ),
        ),
      ),
    );
  }

  Widget _buildGrid(List<dynamic> list, String emptyMsg) {
  if (list.isEmpty) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Text(
          emptyMsg, 
          textAlign: TextAlign.center, 
          style: const TextStyle(color: Colors.white70, fontSize: 16)
        ),
      ),
    );
  }

  return GridView.builder(
    padding: const EdgeInsets.all(16),
    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: 2, 
      childAspectRatio: 0.72, 
      crossAxisSpacing: 14, 
      mainAxisSpacing: 14,
    ),
    itemCount: list.length,
    itemBuilder: (context, index) {
      final movie = list[index];
      
      // Determine if we show the Trash icon (delete) or Plus icon (save)
      bool isDeletable = showSaved && !isSearching;

      return MovieCard(
        movieData: movie,
        isSaved: isDeletable,
        userId: userId,     // Required for instant rating
        jwtToken: jwtToken, // Required for instant rating
        onIconTap: () async {
          if (isDeletable) {
            // Updated to use the corrected remove call
            await MovieService().deleteFromWatchlist(userId, movie['id'], jwtToken);
            _loadData(); // Refresh to remove the card from view
          } else {
            // Save movie logic
            await MovieService().addToWatchlist(userId, movie, jwtToken);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text("Added ${movie['title'] ?? 'Movie'} to Watchlist!")),
              );
              _loadData(); // Refresh data to sync the UI
            }
          }
        },
      );
    },
  );
}
}

// --- MOVIE CARD WIDGET (FIXED STACK) ---

class MovieCard extends StatefulWidget {
  final dynamic movieData;
  final bool isSaved;
  final VoidCallback onIconTap;
  final String userId;
  final String jwtToken;

  const MovieCard({
    super.key,
    required this.movieData,
    required this.isSaved,
    required this.onIconTap,
    required this.userId,
    required this.jwtToken,
  });

  @override
  State<MovieCard> createState() => _MovieCardState();
}

class _MovieCardState extends State<MovieCard> {
  late int localRating;

  @override
  void initState() {
    super.initState();
    localRating = widget.movieData['rating'] ?? 0;
  }

  @override
  void didUpdateWidget(MovieCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.movieData['rating'] != oldWidget.movieData['rating']) {
      setState(() {
        localRating = widget.movieData['rating'] ?? 0;
      });
    }
  }

  void _updateRating(int newRating) {
    setState(() {
      // 3. Logic to "unclick": if clicking the same rating, set to 0
      if (localRating == newRating) {
        localRating = 0;
      } else {
        localRating = newRating;
      }
    });
    
    MovieService().rateMovie(
      widget.userId, 
      widget.movieData['id'], 
      localRating, // Sends 0 if unclicked
      widget.jwtToken
    );
  }

  @override
  Widget build(BuildContext context) {
    String title = widget.movieData['title'] ?? "Unknown Movie";
    String? posterPath = widget.movieData['poster_path'];
    String imageUrl = "https://image.tmdb.org/t/p/w500$posterPath";

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFB2D3D2),
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4, offset: const Offset(0, 2))
        ]
      ),
      padding: const EdgeInsets.all(8),
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Center(
                  child: posterPath != null && posterPath.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(imageUrl, fit: BoxFit.cover),
                        )
                      : const Icon(Icons.movie, size: 50, color: Colors.white),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              
              // 2. Only show stars if the movie is in the "Saved" list
              if (widget.isSaved)
                Row(
                  children: List.generate(5, (index) {
                    return GestureDetector(
                      onTap: () => _updateRating(index + 1),
                      child: Icon(
                        index < localRating ? Icons.star : Icons.star_border,
                        // 1. Stars turn yellow when active
                        color: index < localRating ? Colors.yellow[700] : Colors.black87,
                        size: 18,
                      ),
                    );
                  }),
                ),
            ],
          ),
          Positioned(
            top: 0,
            right: 0,
            child: GestureDetector(
              onTap: widget.onIconTap,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                child: Icon(
                  widget.isSaved ? Icons.delete : Icons.add,
                  color: widget.isSaved ? Colors.red : Colors.green,
                  size: 18,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}