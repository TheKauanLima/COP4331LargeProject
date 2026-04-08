const express = require('express');
const User = require('../models/User');
const { hashPassword } = require('../utils/authUtils');
const authMiddleware = require('../middleware/authMiddleware');

module.exports = function createUserRoutes()
{
    const router = express.Router();
    router.use(authMiddleware);

    router.post('/getuser', async (req, res, next) =>
    {
        // incoming: userId
        // outgoing: user, error
        var error = '';
        const { userId } = req.body;

        if (!userId)
        {
            res.status(200).json({ error: 'UserID is required.' });
            return;
        }

        try
        {
            const user = await User.findOne({ UserID: userId })
                .select('-_id -Password -VerificationTokenHash -VerificationTokenExpires')
                .lean();

            if (!user)
            {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            if (!user.watchList)
            {
                user.watchList = [];
            }

            if (!user.watchedMovies)
            {
                user.watchedMovies = [];
            }

            res.status(200).json({ user: user, error: '' });
        }
        catch (e)
        {
            error = e.toString();
            res.status(200).json({ error: error });
        }
    });

    router.post('/edituser', async (req, res, next) =>
    {
        // incoming: userId, firstName, lastName, login, password
        // outgoing: error
        var error = '';
        const { userId, firstName, lastName, login, password } = req.body;

        if (!userId || !firstName || !lastName || !login || !password)
        {
            res.status(200).json({ error: 'All fields are required.' });
            return;
        }

        try
        {
            const hashedPassword = await hashPassword(password);

            const existingUser = await User.findOne({
                Login: login,
                UserID: { $ne: userId }
            }).lean();

            if (existingUser)
            {
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

            if (result.matchedCount === 0)
            {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            res.status(200).json({ error: '' });
        }
        catch (e)
        {
            error = e.toString();
            res.status(200).json({ error: error });
        }
    });

    router.post('/deleteuser', async (req, res, next) =>
    {
        // incoming: userId
        // outgoing: error
        var error = '';
        const { userId } = req.body;

        if (!userId)
        {
            res.status(200).json({ error: 'UserID is required.' });
            return;
        }

        try
        {
            const result = await User.deleteOne({ UserID: userId });

            if (result.deletedCount === 0)
            {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            res.status(200).json({ error: '' });
        }
        catch (e)
        {
            error = e.toString();
            res.status(200).json({ error: error });
        }
    });

    router.post('/watchlist/add', async (req, res) =>
    {
        try
        {
            const { userId, movie } = req.body;

            if (!userId || !movie || !movie.id || !movie.title)
            {
                return res.status(400).json({ error: 'Missing userId or movie data.' });
            }

            const movieToAdd = {
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path || '',
                release_date: movie.release_date || ''
            };

            const result = await User.updateOne(
                { UserID: userId, "watchList.id": { $ne: movie.id } },
                { $push: { watchList: movieToAdd } }
            );

            if (result.matchedCount === 0)
            {
                return res.status(200).json({ error: 'User not found or movie already in watchList.' });
            }

            return res.status(200).json({ error: '', message: 'Movie added to watchList.' });
        }
        catch (e)
        {
            return res.status(500).json({ error: e.toString() });
        }
    });

    router.post('/watched/add', async (req, res) =>
    {
        try
        {
            const { userId, movie } = req.body;

            if (!userId || !movie || !movie.id || !movie.title)
            {
                return res.status(400).json({ error: 'Missing userId or movie data.' });
            }

            const movieToAdd = {
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path || '',
                release_date: movie.release_date || ''
            };

            const result = await User.updateOne(
                { UserID: userId, "watchedMovies.id": { $ne: movie.id } },
                { $push: { watchedMovies: movieToAdd } }
            );

            if (result.matchedCount === 0)
            {
                return res.status(200).json({ error: 'User not found or movie already in watchedMovies.' });
            }

            return res.status(200).json({ error: '', message: 'Movie added to watchedMovies.' });
        }
        catch (e)
        {
            return res.status(500).json({ error: e.toString() });
        }
    });

    router.post('/watchlist/get', async (req, res) =>
    {
        var error = '';
        const { userId } = req.body;

        if (!userId)
        {
            res.status(200).json({ error: 'UserID is required.' });
            return;
        }

        try
        {
            const user = await User.findOne({ UserID: userId })
                .select('-_id watchList')
                .lean();

            if (!user)
            {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            res.status(200).json({
                error: '',
                watchList: user.watchList || []
            });
        }
        catch (e)
        {
            error = e.toString();
            res.status(200).json({ error: error });
        }
    });

    router.post('/watched/get', async (req, res) =>
    {
        var error = '';
        const { userId } = req.body;

        if (!userId)
        {
            res.status(200).json({ error: 'UserID is required.' });
            return;
        }

        try
        {
            const user = await User.findOne({ UserID: userId })
                .select('-_id watchedMovies')
                .lean();

            if (!user)
            {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            res.status(200).json({
                error: '',
                watchedMovies: user.watchedMovies || []
            });
        }
        catch (e)
        {
            error = e.toString();
            res.status(200).json({ error: error });
        }
    });

    return router;
};
