const express = require('express');

module.exports = function createMovieRoutes()
{
    const router = express.Router();

    async function fetchSimilarMovies(movieId)
    {
        const url = `https://api.themoviedb.org/3/movie/${movieId}/similar`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`
            }
        });

        const data = await response.json();

        if (!response.ok)
        {
            throw new Error(`TMDB error for movie ${movieId}: ${JSON.stringify(data)}`);
        }

        return data.results || [];
    }

    router.get('/movies/search', async (req, res) =>
    {
        try
        {
            const query = req.query.q;

            if (!query)
            {
                return res.status(400).json({ error: 'Missing q parameter' });
            }

            const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`;

            console.log('Calling:', url);
            console.log('Token exists:', !!process.env.TMDB_READ_TOKEN);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`
                }
            });

            const text = await response.text();
            console.log('TMDB status:', response.status);
            console.log('TMDB raw body:', text);

            let data;
            try
            {
                data = JSON.parse(text);
            }
            catch
            {
                data = { raw: text };
            }

            if (!response.ok)
            {
                return res.status(response.status).json({
                    error: 'TMDB request failed',
                    details: data
                });
            }

            return res.json(data);
        }
        catch (error)
        {
            console.error('FULL FETCH ERROR:', error);
            console.error('CAUSE:', error.cause);

            return res.status(500).json({
                error: 'Internal server error',
                message: error.message,
                cause: error.cause ? String(error.cause) : null
            });
        }
    });

    router.post('/movies/similar-list', async (req, res) =>
    {
        try
        {
            console.log('BODY:', req.body);

            const { movies } = req.body || {};

            if (!Array.isArray(movies) || movies.length === 0)
            {
                return res.status(400).json({
                    error: 'Request body must include a non-empty movies array'
                });
            }

            const movieIds = movies
                .map((movie) => movie.id)
                .filter((id) => Number.isInteger(id));

            if (movieIds.length === 0)
            {
                return res.status(400).json({
                    error: 'Each movie must include an integer id'
                });
            }

            const similarLists = await Promise.all(
                movieIds.map((id) => fetchSimilarMovies(id))
            );

            const inputIds = new Set(movieIds);
            const combinedMap = new Map();

            for (const similarMovies of similarLists)
            {
                for (const movie of similarMovies)
                {
                    if (inputIds.has(movie.id))
                    {
                        continue;
                    }

                    if (!combinedMap.has(movie.id))
                    {
                        combinedMap.set(movie.id, {
                            id: movie.id,
                            title: movie.title,
                            original_title: movie.original_title,
                            overview: movie.overview,
                            release_date: movie.release_date,
                            poster_path: movie.poster_path,
                            backdrop_path: movie.backdrop_path,
                            vote_average: movie.vote_average,
                            vote_count: movie.vote_count,
                            popularity: movie.popularity,
                            original_language: movie.original_language,
                            genre_ids: movie.genre_ids || [],
                            matched_count: 1
                        });
                    }
                    else
                    {
                        combinedMap.get(movie.id).matched_count += 1;
                    }
                }
            }

            const results = Array.from(combinedMap.values()).sort((a, b) =>
            {
                if (b.matched_count !== a.matched_count)
                {
                    return b.matched_count - a.matched_count;
                }
                return b.popularity - a.popularity;
            });

            return res.json({
                input_movies: movies,
                count: results.length,
                results
            });
        }
        catch (error)
        {
            console.error('SIMILAR LIST ERROR:', error);

            return res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });

    return router;
};
