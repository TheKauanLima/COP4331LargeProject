require('./setup');

const request = require('supertest');
const express = require('express');

jest.mock('../utils/authUtils', () => {
    const actual = jest.requireActual('../utils/authUtils');
    return {
        ...actual,
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined)
    };
});

const createAuthRoutes = require('../routes/authRoutes');

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api', createAuthRoutes());
    return app;
}

describe('Auth API', () => {
    test('register failure returns 200 with error when required fields are missing', async () => {
        const app = createTestApp();

        const response = await request(app)
            .post('/api/register')
            .send({
                firstName: 'Missing',
                lastName: 'Fields',
                login: 'missing_fields_01',
                password: 'Password123!'
            });

        expect(response.status).toBe(200);
        expect(response.body.error).toBe('All fields are required.');
    });

    test('register success returns 200 with empty error', async () => {
        const app = createTestApp();

        const payload = {
            firstName: 'Test',
            lastName: 'User',
            login: 'test_user_01',
            password: 'Password123!',
            email: 'test_user_01@example.com'
        };

        const response = await request(app)
            .post('/api/register')
            .send(payload);

        expect(response.status).toBe(200);
        expect(response.body.error).toBe('');
        expect(response.body.message).toBe('Account created. Please check your email to verify your account.');
    });

    test('login failure returns 200 with login/password incorrect error', async () => {
        const app = createTestApp();

        await request(app)
            .post('/api/register')
            .send({
                firstName: 'Login',
                lastName: 'Target',
                login: 'login_target_01',
                password: 'CorrectPass123!',
                email: 'login_target_01@example.com'
            });

        const response = await request(app)
            .post('/api/login')
            .send({
                login: 'login_target_01',
                password: 'WrongPass123!'
            });

        expect(response.status).toBe(200);
        expect(response.body.error).toBe('Login/Password incorrect');
    });

    test('register failure returns 200 with error on duplicate email', async () => {
        const app = createTestApp();

        await request(app)
            .post('/api/register')
            .send({
                firstName: 'Dup',
                lastName: 'Email',
                login: 'dup_email_user_01',
                password: 'Password123!',
                email: 'dup_email@example.com'
            });

        const response = await request(app)
            .post('/api/register')
            .send({
                firstName: 'Another',
                lastName: 'User',
                login: 'dup_email_user_02',
                password: 'Password123!',
                email: 'dup_email@example.com'
            });

        expect(response.status).toBe(200);
        expect(response.body.error).toBe('Email already exists.');
    });

    test('login failure returns 200 with verification required error if email is not verified', async () => {
        const app = createTestApp();

        await request(app)
            .post('/api/register')
            .send({
                firstName: 'Needs',
                lastName: 'Verify',
                login: 'needs_verify_01',
                password: 'Password123!',
                email: 'needs_verify_01@example.com'
            });

        const response = await request(app)
            .post('/api/login')
            .send({
                login: 'needs_verify_01',
                password: 'Password123!'
            });

        expect(response.status).toBe(200);
        expect(response.body.error).toBe('Please verify your email before logging in.');
        expect(response.body.verificationRequired).toBe(true);
    });
});
