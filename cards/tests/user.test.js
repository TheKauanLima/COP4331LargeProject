require('./setup');

const request = require('supertest');
const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const createUserRoutes = require('../routes/userRoutes');
const token = require('../createJWT');

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api', authMiddleware, createUserRoutes());
    return app;
}

async function createUserAndToken(userId) {
    const userRecord = {
        UserID: userId,
        FirstName: 'Jwt',
        LastName: 'Tester',
        Login: `jwt_tester_${userId}`,
        Password: 'hashed-or-plain-not-used-here',
        Email: `jwt_tester_${userId}@example.com`,
        IsEmailVerified: true,
        VerificationTokenHash: null,
        VerificationTokenExpires: null,
        watchList: [],
        watchedMovies: []
    };

    await User.create(userRecord);
    return token.createToken(userRecord.FirstName, userRecord.LastName, userId).accessToken;
}

describe('User API JWT middleware', () => {
    test('protected route rejects request without JWT', async () => {
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

    test('protected route rejects request with invalid JWT', async () => {
        const app = createTestApp();

        const response = await request(app)
            .post('/api/watchlist/add')
            .send({
                userId: 1,
                movie: {
                    id: 550,
                    title: 'Fight Club'
                },
                jwtToken: 'this.is.not.a.valid.jwt'
            });

        expect(response.status).toBe(200);
        expect(response.body.error).toBe('The JWT is no longer valid');
    });

    test('protected route accepts request with valid JWT', async () => {
        const app = createTestApp();
        const createdToken = await createUserAndToken(999);

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

    test('watchlist add returns duplicate error when movie is already present', async () => {
        const app = createTestApp();
        const createdToken = await createUserAndToken(1000);

        const payload = {
            userId: 1000,
            movie: {
                id: 13,
                title: 'Forrest Gump',
                poster_path: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
                release_date: '1994-06-23'
            },
            jwtToken: createdToken
        };

        const firstResponse = await request(app)
            .post('/api/watchlist/add')
            .send(payload);

        const secondResponse = await request(app)
            .post('/api/watchlist/add')
            .send(payload);

        expect(firstResponse.status).toBe(200);
        expect(firstResponse.body.error).toBe('');
        expect(secondResponse.status).toBe(200);
        expect(secondResponse.body.error).toBe('User not found or movie already in watchList.');

        const updatedUser = await User.findOne({ UserID: 1000 }).lean();
        expect(updatedUser.watchList).toHaveLength(1);
    });

    test('watchlist add returns 400 when movie data is missing', async () => {
        const app = createTestApp();
        const createdToken = await createUserAndToken(1001);

        const response = await request(app)
            .post('/api/watchlist/add')
            .send({
                userId: 1001,
                jwtToken: createdToken
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing userId or movie data.');
    });
});
