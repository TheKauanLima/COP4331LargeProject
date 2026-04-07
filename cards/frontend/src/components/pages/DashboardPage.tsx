//import React from 'react';

interface Movie {
  id: string;
  title: string;
  year: string;
  rating: number;
}

const MOCK_MOVIES: Movie[] = [
  { id: '1', title: 'Movie Title', year: 'Year', rating: 3 },
  { id: '2', title: 'Movie Title', year: 'Year', rating: 3 },
  { id: '3', title: 'Movie Title', year: 'Year', rating: 3 },
];

const SearchIcon = () => (
  <svg className="icon-search" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="icon-user" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z"/>
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

const StarIcon = () => (
  <svg className="icon-star" fill="currentColor" stroke="black" strokeWidth={1} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function DashboardPage() {
  return (
    <div className="film-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-logo">FilmBuffs</h1>
        
        <div className="search-wrapper">
          <input 
            type="text" 
            placeholder="Search" 
            className="search-input"
          />
          <SearchIcon />
        </div>

        <div className="user-profile">
          <UserIcon />
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-wrapper">
        <div className="tabs-container">
          <button className="tab active-tab">
            <BookmarkIcon />
            My Saved Movies
          </button>
          <button className="tab inactive-tab">
            Recommended For You
          </button>
        </div>
      </div>

      {/* Movie Grid */}
      <div className="movie-grid">
        {MOCK_MOVIES.map((movie) => (
          <div key={movie.id} className="movie-card">
            <div className="movie-image-placeholder">
              <CameraIcon />
            </div>
            <h2 className="movie-title">{movie.title}</h2>
            <p className="movie-year">{movie.year}</p>
            <div className="movie-rating">
              {[...Array(movie.rating)].map((_, index) => (
                <StarIcon key={index} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}