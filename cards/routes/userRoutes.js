const express = require('express');
const User = require('../models/User');
const { hashPassword } = require('../utils/authUtils');
const authMiddleware = require('../middleware/authMiddleware');

const tmdbReadToken = process.env.TMDB_READ_TOKEN;

async function fetchMovieDetails(movieId) {
    try {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=credits`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${tmdbReadToken}`
            }
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    }
    catch (e) {
        console.error('TMDB details fetch failed:', e);
        return null;
    }
}

module.exports = function createUserRoutes() {
    const router = express.Router();
    router.use(authMiddleware);

    router.post('/getuser', async (req, res, next) => {
        // incoming: userId
        // outgoing: user, error
        var error = '';
        const { userId } = req.body;

        if (!userId) {
            res.status(200).json({ error: 'UserID is required.' });
            return;
        }

        try {
            const user = await User.findOne({ UserID: userId })
                .select('-_id -Password -VerificationTokenHash -VerificationTokenExpires')
                .lean();

            if (!user) {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            if (!user.watchList) {
                user.watchList = [];
            }

            if (!user.watchedMovies) {
                user.watchedMovies = [];
            }

            res.status(200).json({ user: user, error: '' });
        }
        catch (e) {
            error = e.toString();
            res.status(200).json({ error: error });
        }
    });

    router.post('/edituser', async (req, res, next) => {
        // incoming: userId, firstName, lastName, login, password
        // outgoing: error
        var error = '';
        const { userId, firstName, lastName, login, password } = req.body;

        if (!userId || !firstName || !lastName || !login || !password) {
            res.status(200).json({ error: 'All fields are required.' });
            return;
        }

        try {
            const hashedPassword = await hashPassword(password);

            const existingUser = await User.findOne({
                Login: login,
                UserID: { $ne: userId }
            }).lean();

            if (existingUser) {
                res.status(200).json({ error: 'Username already exists.' });
                return;
            }

            const result = await User.updateOne(
                { UserID: userId },
                {
                    $set: {
                        FirstName: firstName,
                        LastName: lastName,
                        Login: login,
                        Password: hashedPassword
                    }
                }
            );

            if (result.matchedCount === 0) {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            res.status(200).json({ error: '' });
        }
        catch (e) {
            error = e.toString();
            res.status(200).json({ error: error });
        }
    });

    router.post('/deleteuser', async (req, res, next) => {
        // incoming: userId
        // outgoing: error
        var error = '';
        const { userId } = req.body;

        if (!userId) {
            res.status(200).json({ error: 'UserID is required.' });
            return;
        }

        try {
            const result = await User.deleteOne({ UserID: userId });

            if (result.deletedCount === 0) {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            res.status(200).json({ error: '' });
        }
        catch (e) {
            error = e.toString();
            res.status(200).json({ error: error });
        }
    });

    router.post('/watchlist/add', async (req, res) => {
        try {
            const { userId, movie } = req.body;

            if (!userId || !movie || !movie.id || !movie.title) {
                return res.status(400).json({ error: 'Missing userId or movie data.' });
            }

            const details = await fetchMovieDetails(movie.id);
            const director = details?.credits?.crew?.find((c) => c.job === 'Director')?.name || '';
            const genres = details?.genres?.map((g) => g.name) || [];

            const movieToAdd = {
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path || '',
                release_date: movie.release_date || '',
                director,
                genres
            };

            const result = await User.updateOne(
                { UserID: userId, "watchList.id": { $ne: movie.id } },
                { $push: { watchList: movieToAdd } }
            );

            if (result.matchedCount === 0) {
                return res.status(200).json({ error: 'User not found or movie already in watchList.' });
            }

            return res.status(200).json({ error: '', message: 'Movie added to watchList.' });
        }
        catch (e) {
            return res.status(500).json({ error: e.toString() });
        }
    });

    router.post('/watchlist/remove', async (req, res) => {
        try {
            const { userId, movieId } = req.body;

            if (!userId || !movieId) {
                return res.status(400).json({ error: 'Missing userId or movieId.' });
            }

            const result = await User.updateOne(
                { UserID: Number(userId) },
                { $pull: { watchList: { id: Number(movieId) } } }
            );

            if (result.matchedCount === 0) {
                return res.status(200).json({ error: 'User not found.' });
            }

            return res.status(200).json({ error: '', message: 'Movie removed from watchList.' });
        }
        catch (e) {
            return res.status(500).json({ error: e.toString() });
        }
    });

    router.post('/watchlist/rate', async (req, res) => {
        try {
            const { userId, movieId, rating } = req.body;
            const parsedRating = Number(rating);

            if (!userId || !movieId) {
                return res.status(400).json({ error: 'Missing userId or movieId.' });
            }

            if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
            }

            const result = await User.updateOne(
                { UserID: Number(userId), "watchList.id": Number(movieId) },
                { $set: { "watchList.$.userRating": parsedRating } }
            );

            if (result.matchedCount === 0) {
                return res.status(200).json({ error: 'User or movie not found in watchList.' });
            }

            return res.status(200).json({ error: '', message: 'Movie rating updated.' });
        }
        catch (e) {
            return res.status(500).json({ error: e.toString() });
        }
    });

    router.post('/watched/add', async (req, res) => {
        try {
            const { userId, movie } = req.body;

            if (!userId || !movie || !movie.id || !movie.title) {
                return res.status(400).json({ error: 'Missing userId or movie data.' });
            }

            const details = await fetchMovieDetails(movie.id);
            const director = details?.credits?.crew?.find((c) => c.job === 'Director')?.name || '';
            const genres = details?.genres?.map((g) => g.name) || [];

            const movieToAdd = {
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path || '',
                release_date: movie.release_date || '',
                director,
                genres
            };

            const result = await User.updateOne(
                { UserID: userId, "watchedMovies.id": { $ne: movie.id } },
                { $push: { watchedMovies: movieToAdd } }
            );

            if (result.matchedCount === 0) {
                return res.status(200).json({ error: 'User not found or movie already in watchedMovies.' });
            }

            return res.status(200).json({ error: '', message: 'Movie added to watchedMovies.' });
        }
        catch (e) {
            return res.status(500).json({ error: e.toString() });
        }
    });

    router.post('/watchlist/get', async (req, res) => {
        var error = '';
        const { userId } = req.body;

        if (!userId) {
            res.status(200).json({ error: 'UserID is required.' });
            return;
        }

        try {
            const user = await User.findOne({ UserID: userId })
                .select('-_id watchList')
                .lean();

            if (!user) {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            res.status(200).json({
                error: '',
                watchList: user.watchList || []
            });
        }
        catch (e) {
            error = e.toString();
            res.status(200).json({ error: error });
        }
    });

    router.post('/watched/get', async (req, res) => {
        var error = '';
        const { userId } = req.body;

        if (!userId) {
            res.status(200).json({ error: 'UserID is required.' });
            return;
        }

        try {
            const user = await User.findOne({ UserID: userId })
                .select('-_id watchedMovies')
                .lean();

            if (!user) {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            res.status(200).json({
                error: '',
                watchedMovies: user.watchedMovies || []
            });
        }
        catch (e) {
            error = e.toString();
            res.status(200).json({ error: error });
        }
    });

    return router;
};
