require('./setup');

const request = require('supertest');
const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const createUserRoutes = require('../routes/userRoutes');
const token = require('../createJWT');

function createTestApp()
{
    const app = express();
    app.use(express.json());
    app.use('/api', authMiddleware, createUserRoutes());
    return app;
}

describe('User API JWT middleware', () =>
{
    test('protected route rejects request without JWT', async () =>
    {
        const app = createTestApp();

        const response = await request(app)
            .post('/api/watchlist/add')
            .send({
                userId: 1,
                movie: {
                    id: 550,
                    title: 'Fight Club',
                    poster_path: '/a26cQPRhJPX6GbWfQbvZdrrp9j9.jpg',
                    release_date: '1999-10-15'
                }
            });

        expect(response.status).toBe(200);
        expect(response.body.error).toBe('The JWT is no longer valid');
    });

    test('protected route accepts request with valid JWT', async () =>
    {
        const app = createTestApp();

        await User.create({
            UserID: 999,
            FirstName: 'Jwt',
            LastName: 'Tester',
            Login: 'jwt_tester_01',
            Password: 'hashed-or-plain-not-used-here',
            Email: 'jwt_tester_01@example.com',
            IsEmailVerified: true,
            VerificationTokenHash: null,
            VerificationTokenExpires: null,
            watchList: [],
            watchedMovies: []
        });

        const createdToken = token.createToken('Jwt', 'Tester', 999).accessToken;

        const response = await request(app)
            .post('/api/watchlist/add')
            .send({
                userId: 999,
                movie: {
                    id: 680,
                    title: 'Pulp Fiction',
                    poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
                    release_date: '1994-09-10'
                },
                jwtToken: createdToken
            });

        expect(response.status).toBe(200);
        expect(response.body.error).toBe('');
        expect(response.body.message).toBe('Movie added to watchList.');

        const updatedUser = await User.findOne({ UserID: 999 }).lean();
        expect(updatedUser.watchList).toHaveLength(1);
        expect(updatedUser.watchList[0].id).toBe(680);
    });
});
