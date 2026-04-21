import 'package:http/http.dart' as http;
import 'dart:convert';

class MovieService {
  // Removing the trailing /api here because your function calls add it below
  final String baseUrl = "http://filmbuff.info"; 

  // --- AUTH METHODS ---

  Future<Map<String, dynamic>> login(String login, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'login': login, 
          'password': password
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': "Connection failed: $e"};
    }
  }

  Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String login,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/register'),
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
    } catch (e) {
      return {'error': 'Registration connection failed: $e'};
    }
  }

  // --- MOVIE METHODS ---

  /// GET WATCHLIST (This is what will find "Scream")
  Future<Map<String, dynamic>> getUserWatchlist(String userId, String jwtToken) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/watchlist/get'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken', 
        },
        body: jsonEncode({
          'userId': int.parse(userId),
          'jwtToken': jwtToken, // The backend needs the token in the body AND header usually
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Watchlist fetch failed: $e'};
    }
  }

  /// GLOBAL SEARCH (This is what will find "Batman")
  Future<Map<String, dynamic>> searchMovies(String userId, String query, String jwtToken) async {
    try {
      // Per your React code, this is a GET request with a query param 'q'
      final url = Uri.parse('$baseUrl/api/movies/search?q=${Uri.encodeComponent(query)}');
      
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken', 
        },
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Search failed: $e'};
    }
  }

  // Inside MovieService class in movie_service.dart

Future<Map<String, dynamic>> getWatchedMovies(String userId, String jwtToken) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/watched/get'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $jwtToken',
      },
      body: jsonEncode({
        'userId': int.parse(userId),
        'jwtToken': jwtToken,
      }),
    );
    return jsonDecode(response.body);
  } catch (e) {
    return {'error': e.toString()};
  }
}

Future<Map<String, dynamic>> getSimilarMovies(List<dynamic> sourceMovies, String jwtToken) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/movies/similar-list'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $jwtToken',
      },
      body: jsonEncode({'movies': sourceMovies}),
    );
    return jsonDecode(response.body);
  } catch (e) {
    return {'error': e.toString()};
  }
}

// ADD TO movie_service.dart

Future<Map<String, dynamic>> addToWatchlist(String userId, dynamic movie, String jwtToken) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/watchlist/add'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $jwtToken',
    },
    body: jsonEncode({
      'userId': int.parse(userId),
      'movie': movie,
      'jwtToken': jwtToken,
    }),
  );
  return jsonDecode(response.body);
}

Future<Map<String, dynamic>> deleteFromWatchlist(String userId, int movieId, String jwtToken) async {
  try {
    // Changed 'delete' to 'remove' to match your web app
    final url = Uri.parse('$baseUrl/api/watchlist/remove'); 

    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $jwtToken',
      },
      body: jsonEncode({
        'userId': int.parse(userId),
        'movieId': movieId,
        // Removed jwtToken from body since your web fetch doesn't use it there
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      print("Server Error ${response.statusCode}: ${response.body}");
      return {'error': 'Failed to remove movie'};
    }
  } catch (e) {
    print("Delete Error: $e");
    return {'error': e.toString()};
  }
}

Future<Map<String, dynamic>> rateMovie(String userId, int movieId, int rating, String jwtToken) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/watchlist/rate'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $jwtToken',
      },
      body: jsonEncode({
        'userId': int.parse(userId),
        'movieId': movieId,
        'rating': rating,
      }),
    );
    return jsonDecode(response.body);
  } catch (e) {
    return {'error': e.toString()};
  }
}

Future<Map<String, dynamic>> sendPasswordReset(String email) async {
  try {
    // Check your backend route—usually it's /api/forgot-password or /api/reset-password
    final response = await http.post(
      Uri.parse('$baseUrl/api/forgot-password'), 
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      // Log the error body to see if the server says "User not found"
      print("Reset Error: ${response.body}");
      return {'error': 'Failed to send reset link'};
    }
  } catch (e) {
    return {'error': e.toString()};
  }
}
}