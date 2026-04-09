const express = require('express');
const token = require('../createJWT.js');
const User = require('../models/User');
const {
    isBcryptHash,
    hashPassword,
    verifyPassword,
    createVerificationToken,
    hashVerificationToken,
    sendVerificationEmail
} = require('../utils/authUtils');

module.exports = function createAuthRoutes()
{
    const router = express.Router();

    router.post('/register', async (req, res, next) =>
    {
        // incoming: firstName, lastName, login, password, email
        // outgoing: error
        var error = '';
        const { firstName, lastName, login, password, email } = req.body;

        if (!firstName || !lastName || !login || !password || !email)
        {
            res.status(200).json({ error: 'All fields are required.' });
            return;
        }

        try
        {
            const existingUser = await User.findOne({ Login: login }).lean();
            const existingEmail = await User.findOne({ Email: email }).lean();

            if (existingUser)
            {
                res.status(200).json({ error: 'Username already exists.' });
                return;
            }

            if (existingEmail)
            {
                res.status(200).json({ error: 'Email already exists.' });
                return;
            }

            const lastUser = await User.findOne({ UserID: { $exists: true } }).sort({ UserID: -1 }).lean();
            const nextUserId = lastUser ? (lastUser.UserID + 1) : 1;
            const hashedPassword = await hashPassword(password);

            const verificationToken = createVerificationToken();
            const verificationTokenHash = hashVerificationToken(verificationToken);
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await User.create({
                UserID: nextUserId,
                FirstName: firstName,
                LastName: lastName,
                Login: login,
                Password: hashedPassword,
                Email: email,
                IsEmailVerified: false,
                VerificationTokenHash: verificationTokenHash,
                VerificationTokenExpires: verificationTokenExpires,
                watchedMovies: [],
                watchList: []
            });

            await sendVerificationEmail(email, verificationToken);
        }
        catch (e)
        {
            error = e.toString();
        }

        if (error)
        {
            res.status(200).json({ error: error });
            return;
        }

        res.status(200).json({ error: '', message: 'Account created. Please check your email to verify your account.' });
    });

    router.post('/login', async (req, res, next) =>
    {
        // incoming: login, password
        // outgoing: id, firstName, lastName, error
        const { login, password } = req.body;

        const user = await User.findOne({ Login: login });
        var ret;

        if (user)
        {
            const matchesPassword = await verifyPassword(password, user.Password);
            if (!matchesPassword)
            {
                ret = { error: 'Login/Password incorrect' };
                res.status(200).json(ret);
                return;
            }

            if (!isBcryptHash(user.Password))
            {
                const upgradedHash = await hashPassword(password);
                await User.updateOne(
                    { _id: user._id },
                    { $set: { Password: upgradedHash } }
                );
            }

            if (user.IsEmailVerified === false)
            {
                ret = {
                    error: 'Please verify your email before logging in.',
                    verificationRequired: true,
                    email: user.Email || ''
                };
                res.status(200).json(ret);
                return;
            }

            var id = user.UserID;
            var fn = user.FirstName;
            var ln = user.LastName;

            try
            {
                ret = token.createToken(fn, ln, id);
            }
            catch (e)
            {
                ret = { error: e.message };
            }
        }
        else
        {
            ret = { error: 'Login/Password incorrect' };
        }

        //var ret = { id:id, firstName:fn, lastName:ln, error:''};
        res.status(200).json(ret);
    });

    router.post('/verify-email', async (req, res, next) =>
    {
        // incoming: token
        // outgoing: error, message
        const { token } = req.body;

        if (!token)
        {
            res.status(200).json({ error: 'Verification token is required.' });
            return;
        }

        try
        {
            const tokenHash = hashVerificationToken(token);

            const result = await User.updateOne(
                {
                    VerificationTokenHash: tokenHash,
                    VerificationTokenExpires: { $gt: new Date() }
                },
                {
                    $set: { IsEmailVerified: true },
                    $unset: { VerificationTokenHash: '', VerificationTokenExpires: '' }
                }
            );

            if (result.matchedCount === 0)
            {
                res.status(200).json({ error: 'Invalid or expired verification token.' });
                return;
            }

            res.status(200).json({ error: '', message: 'Email verified successfully. You can now log in.' });
        }
        catch (e)
        {
            res.status(200).json({ error: e.toString() });
        }
    });

    router.post('/resend-verification', async (req, res, next) =>
    {
        // incoming: loginOrEmail
        // outgoing: error, message
        const { loginOrEmail } = req.body;

        if (!loginOrEmail)
        {
            res.status(200).json({ error: 'Username or email is required.' });
            return;
        }

        try
        {
            const user = await User.findOne({
                $or: [
                    { Login: loginOrEmail },
                    { Email: loginOrEmail }
                ]
            });

            if (!user)
            {
                res.status(200).json({ error: 'User not found.' });
                return;
            }

            if (user.IsEmailVerified !== false)
            {
                res.status(200).json({ error: 'Email is already verified.' });
                return;
            }

            if (!user.Email)
            {
                res.status(200).json({ error: 'No email found for this account.' });
                return;
            }

            const verificationToken = createVerificationToken();
            const verificationTokenHash = hashVerificationToken(verificationToken);
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        VerificationTokenHash: verificationTokenHash,
                        VerificationTokenExpires: verificationTokenExpires
                    }
                }
            );

            await sendVerificationEmail(user.Email, verificationToken);

            res.status(200).json({ error: '', message: 'Verification email sent.' });
        }
        catch (e)
        {
            res.status(200).json({ error: e.toString() });
        }
    });

    return router;
};
