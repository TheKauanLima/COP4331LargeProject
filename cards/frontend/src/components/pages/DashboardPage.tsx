import { useCallback, useEffect, useState } from 'react';
import { buildPath } from '../Path';
import { retrieveToken } from '../../tokenStorage';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  director?: string;
  genres?: string[];
  userRating?: number;
}

const SearchIcon = ({ onClick }: { onClick?: () => void }) => (
  <svg
    className="icon-search"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BookmarkIcon = () => (
  <svg className="icon-bookmark" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
  </svg>
);

const CameraIcon = () => (
  <svg className="icon-camera" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="icon-trash" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 3a1 1 0 00-1 1v1H5a1 1 0 100 2h1v12a2 2 0 002 2h8a2 2 0 002-2V7h1a1 1 0 100-2h-3V4a1 1 0 00-1-1H9zm1 2h4v1h-4V5zm-2 2h8v12H8V7z" />
  </svg>
);

const StarIcon = ({ isFilled, onClick }: { isFilled: boolean; onClick?: () => void }) => (
  <svg
    className="icon-star"
    fill={isFilled ? '#eab308' : 'transparent'}
    stroke="black"
    strokeWidth={1}
    viewBox="0 0 20 20"
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'saved' | 'recommended'>('saved');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [recommendationsMessage, setRecommendationsMessage] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getAuthContext = useCallback((): { userId: number; jwtToken: string } | null => {
    try {
      const userData = localStorage.getItem('user_data');
      const jwtToken = retrieveToken();

      if (!userData || typeof jwtToken !== 'string' || jwtToken.length === 0) {
        return null;
      }

      const parsed = JSON.parse(userData) as { id?: number };
      if (typeof parsed.id !== 'number' || parsed.id <= 0) {
        return null;
      }

      return { userId: parsed.id, jwtToken };
    } catch (error) {
      console.error('Failed to read auth context:', error);
      return null;
    }
  }, []);

  const fetchWatchlist = useCallback(async (): Promise<void> => {
    const auth = getAuthContext();
    if (!auth) {
      console.error('Missing user/session data.');
      setMovies([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(buildPath('api/watchlist/get'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.jwtToken}`
        },
        body: JSON.stringify({
          userId: auth.userId,
          jwtToken: auth.jwtToken
        })
      });

      const data = (await response.json()) as { error?: string; watchList?: Movie[] };
      if (!response.ok || data.error) {
        console.error('Watchlist fetch failed:', data.error ?? response.statusText);
        setMovies([]);
        return;
      }

      setMovies(Array.isArray(data.watchList) ? data.watchList : []);
    } catch (error) {
      console.error('Watchlist fetch error:', error);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthContext]);

  const searchMovies = useCallback(async (query: string): Promise<void> => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setIsDropdownVisible(false);
      setSearchError('');
      return;
    }

    const auth = getAuthContext();
    const jwtToken = auth?.jwtToken ?? '';

    setIsLoading(true);
    try {
      const response = await fetch(buildPath(`api/movies/search?q=${encodeURIComponent(trimmedQuery)}`), {
        method: 'GET',
        headers: jwtToken.length > 0 ? { Authorization: `Bearer ${jwtToken}` } : undefined
      });

      const data = (await response.json()) as { error?: string; results?: Movie[] };
      if (!response.ok || data.error) {
        console.error('Movie search failed:', data.error ?? response.statusText);
        setSearchError(data.error ?? response.statusText ?? 'Unable to search movies.');
        setIsDropdownVisible(true);
        return;
      }

      setSearchError('');
      setSearchResults(Array.isArray(data.results) ? data.results : []);
      setIsDropdownVisible(true);
    } catch (error) {
      console.error('Movie search error:', error);
      setSearchError('Unable to search movies. Please try again.');
      setIsDropdownVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthContext]);

  const handleMovieSelect = useCallback(async (movie: Movie): Promise<void> => {
    const auth = getAuthContext();
    if (!auth) {
      alert('You must be logged in to add movies to your watchlist.');
      return;
    }

    try {
      const response = await fetch(buildPath('api/watchlist/add'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.jwtToken}`
        },
        body: JSON.stringify({
          userId: auth.userId,
          movie
        })
      });

      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok || data.error) {
        alert(data.error ?? 'Unable to add movie to watchlist.');
        return;
      }

      setSearchQuery('');
      setSearchResults([]);
      setIsDropdownVisible(false);
      await fetchWatchlist();
    } catch (error) {
      console.error('Add to watchlist error:', error);
      alert('Unable to add movie to watchlist.');
    }
  }, [fetchWatchlist, getAuthContext]);

  const handleRateMovie = useCallback(async (movieId: number, rating: number): Promise<void> => {
    const auth = getAuthContext();
    if (!auth) {
      alert('You must be logged in to rate movies.');
      return;
    }

    setMovies((previousMovies) =>
      previousMovies.map((movie) =>
        movie.id === movieId ? { ...movie, userRating: rating } : movie
      )
    );

    try {
      const response = await fetch(buildPath('api/watchlist/rate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.jwtToken}`
        },
        body: JSON.stringify({
          userId: auth.userId,
          movieId,
          rating
        })
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok || data.error) {
        alert(data.error ?? 'Unable to rate movie.');
        await fetchWatchlist();
      }
    } catch (error) {
      console.error('Rate movie error:', error);
      alert('Unable to rate movie.');
      await fetchWatchlist();
    }
  }, [fetchWatchlist, getAuthContext]);

  const handleRemoveFromWatchlist = useCallback(async (movieId: number): Promise<void> => {
    const auth = getAuthContext();
    if (!auth) {
      alert('You must be logged in to remove movies.');
      return;
    }

    try {
      const response = await fetch(buildPath('api/watchlist/remove'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.jwtToken}`
        },
        body: JSON.stringify({
          userId: auth.userId,
          movieId
        })
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok || data.error) {
        alert(data.error ?? 'Unable to remove movie from watchlist.');
        return;
      }

      setMovies((previousMovies) => previousMovies.filter((movie) => movie.id !== movieId));
    } catch (error) {
      console.error('Remove from watchlist error:', error);
      alert('Unable to remove movie from watchlist.');
    }
  }, [getAuthContext]);

  const fetchRecommendations = useCallback(async (): Promise<void> => {
    if (recommendedMovies.length > 0) {
      return;
    }

    const auth = getAuthContext();
    if (!auth) {
      console.error('Missing user/session data.');
      setRecommendedMovies([]);
      setRecommendationsMessage('Add some movies to get recommendations!');
      return;
    }

    setIsLoading(true);
    try {
      let sourceMovies: Movie[] = [];

      const watchedResponse = await fetch(buildPath('api/watched/get'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.jwtToken}`
        },
        body: JSON.stringify({
          userId: auth.userId,
          jwtToken: auth.jwtToken
        })
      });

      const watchedData = (await watchedResponse.json()) as { error?: string; watchedMovies?: Movie[] };
      if (watchedResponse.ok && !watchedData.error && Array.isArray(watchedData.watchedMovies) && watchedData.watchedMovies.length > 0) {
        sourceMovies = watchedData.watchedMovies;
      }

      if (sourceMovies.length === 0) {
        const watchlistResponse = await fetch(buildPath('api/watchlist/get'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.jwtToken}`
          },
          body: JSON.stringify({
            userId: auth.userId,
            jwtToken: auth.jwtToken
          })
        });

        const watchlistData = (await watchlistResponse.json()) as { error?: string; watchList?: Movie[] };
        if (watchlistResponse.ok && !watchlistData.error && Array.isArray(watchlistData.watchList) && watchlistData.watchList.length > 0) {
          sourceMovies = watchlistData.watchList;
        }
      }

      if (sourceMovies.length === 0) {
        setRecommendedMovies([]);
        setRecommendationsMessage('Add some movies to get recommendations!');
        return;
      }

      const similarResponse = await fetch(buildPath('api/movies/similar-list'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.jwtToken}`
        },
        body: JSON.stringify({ movies: sourceMovies })
      });

      const similarData = (await similarResponse.json()) as { error?: string; results?: Movie[] };
      if (!similarResponse.ok || similarData.error) {
        console.error('Recommendations fetch failed:', similarData.error ?? similarResponse.statusText);
        setRecommendedMovies([]);
        setRecommendationsMessage('Unable to load recommendations right now.');
        return;
      }

      const results = Array.isArray(similarData.results) ? similarData.results : [];
      setRecommendedMovies(results);
      setRecommendationsMessage(results.length === 0 ? 'No recommendations found yet.' : '');
    } catch (error) {
      console.error('Recommendations fetch error:', error);
      setRecommendedMovies([]);
      setRecommendationsMessage('Unable to load recommendations right now.');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthContext, recommendedMovies.length]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length === 0) {
      setSearchResults([]);
      setIsDropdownVisible(false);
      setSearchError('');
      return undefined;
    }

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setIsDropdownVisible(false);
      setSearchError('');
      return undefined;
    }

    setIsDropdownVisible(true);
    const timeoutId = window.setTimeout(() => {
      void searchMovies(trimmedQuery);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchMovies, searchQuery]);

  const handleLogout = (): void => {
    localStorage.clear();
    window.location.href = '/';
  };

  const displayMovies = activeTab === 'saved' ? movies : recommendedMovies;
  const emptyMessage = activeTab === 'saved'
    ? 'No movies found.'
    : (recommendationsMessage || 'Add some movies to get recommendations!');

  return (
    <div className="film-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-logo">FilmBuff</h1>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <SearchIcon />

          {isDropdownVisible && searchQuery.trim().length >= 2 && (searchResults.length > 0 || isLoading || searchError.length > 0) && (
            <div className="search-dropdown">
              {isLoading && searchResults.length === 0 && (
                <div className="dropdown-item">
                  <div className="dropdown-poster" aria-hidden="true" />
                  <p className="dropdown-title">Searching...</p>
                </div>
              )}

              {!isLoading && searchError && (
                <div className="dropdown-item">
                  <div className="dropdown-poster" aria-hidden="true" />
                  <p className="dropdown-title">{searchError}</p>
                </div>
              )}

              {!isLoading && !searchError && searchResults.length === 0 && (
                <div className="dropdown-item">
                  <div className="dropdown-poster" aria-hidden="true" />
                  <p className="dropdown-title">No results found</p>
                </div>
              )}

              {searchResults.map((movie) => (
                <div key={movie.id} className="dropdown-item" onClick={() => void handleMovieSelect(movie)}>
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="dropdown-poster"
                    />
                  ) : (
                    <div className="dropdown-poster" aria-hidden="true" />
                  )}

                  <p className="dropdown-title">
                    {movie.title}{movie.release_date ? ` (${movie.release_date.substring(0, 4)})` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button 
            type="button" 
            className="buttons" 
            onClick={handleLogout}
            style={{ margin: 0, backgroundColor: '#EEF5DB', color: '#000' }} // Overriding the background to match the search bar!
          > 
            Log Out 
          </button>
        </div>
      </header>

      <main>

      {/* Tabs */}
      <div className="tabs-wrapper">
        <div className="tabs-container">
          <button
            className={`tab ${activeTab === 'saved' ? 'active-tab' : 'inactive-tab'}`}
            onClick={() => setActiveTab('saved')}
          >
            <BookmarkIcon />
            My Saved Movies
          </button>
          <button
            className={`tab ${activeTab === 'recommended' ? 'active-tab' : 'inactive-tab'}`}
            onClick={() => {
              setActiveTab('recommended');
              void fetchRecommendations();
            }}
          >
            Recommended For You
          </button>
        </div>
      </div>

      {/* Movie Grid */}
      <div className="movie-grid">
        {isLoading && displayMovies.length === 0 && <p className="movie-year">Loading movies...</p>}

        {!isLoading && displayMovies.length === 0 && <p className="movie-year">{emptyMessage}</p>}

        {displayMovies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <div className="movie-image-placeholder">
              {activeTab === 'saved' && (
                <button
                  className="delete-btn"
                  aria-label="Remove Movie"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleRemoveFromWatchlist(movie.id);
                  }}
                >
                  <TrashIcon />
                </button>
              )}

              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="movie-poster"
                />
              ) : (
                <CameraIcon />
              )}
            </div>
            <h2 className="movie-title">{movie.title}</h2>
            <p className="movie-director">{movie.director ? `Dir: ${movie.director}` : ''}</p>
            <p className="movie-genres">{movie.genres && movie.genres.length > 0 ? movie.genres.join(', ') : ''}</p>
            <p className="movie-year">{movie.release_date || 'Unknown release date'}</p>
            <div className="movie-rating">
              {Array.from({ length: 5 }).map((_, index) => (
                <StarIcon
                  key={`${movie.id}-star-${index}`}
                  isFilled={index < (movie.userRating || 0)}
                  onClick={() => void handleRateMovie(movie.id, index + 1)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      </main>
    </div>
  );
}