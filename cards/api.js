require('express');
require('mongodb');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');

const emailService = (process.env.EMAIL_SERVICE || '').toLowerCase();
const resendApiKey = process.env.RESEND_API_KEY;
const emailFromName = process.env.EMAIL_FROM_NAME;
const emailFromAddress = process.env.EMAIL_FROM_ADDRESS;
const verificationSender = emailFromName && emailFromAddress
    ? `${emailFromName} <${emailFromAddress}>`
    : (emailFromAddress || '');
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const resendClient = emailService === 'resend' && resendApiKey ? new Resend(resendApiKey) : null;
const passwordSaltRounds = Number(process.env.PASSWORD_SALT_ROUNDS || 12);

function isBcryptHash(value)
{
    return typeof value === 'string' && value.startsWith('$2');
}

async function hashPassword(plainPassword)
{
    return bcrypt.hash(plainPassword, passwordSaltRounds);
}

async function verifyPassword(plainPassword, storedPassword)
{
    if (!storedPassword)
    {
        return false;
    }

    if (isBcryptHash(storedPassword))
    {
        return bcrypt.compare(plainPassword, storedPassword);
    }

    return storedPassword === plainPassword;
}

function createVerificationToken()
{
    return crypto.randomBytes(32).toString('hex');
}

function hashVerificationToken(token)
{
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function sendVerificationEmail(email, token)
{
    if (emailService !== 'resend')
    {
        throw new Error('EMAIL_SERVICE must be set to resend.');
    }

    if (!resendClient)
    {
        throw new Error('RESEND_API_KEY is not configured.');
    }

    if (!verificationSender)
    {
        throw new Error('EMAIL_FROM_NAME and EMAIL_FROM_ADDRESS must be configured.');
    }

    const verifyLink = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await resendClient.emails.send({
        from: verificationSender,
        to: email,
        subject: 'Verify your account',
        html: `
            <h2>Verify your email</h2>
            <p>Click the link below to verify your account:</p>
            <p><a href="${verifyLink}">${verifyLink}</a></p>
            <p>This link expires in 24 hours.</p>
        `
    });
}

exports.setApp = function(app, client, cardList)
{
    app.post('/api/addcard', async (req, res, next) =>
    {
        // incoming: userId, color
        // outgoing: error
        const { userId, card, jwtToken } = req.body;
        try
        {
            if(token.isExpired(jwtToken))
            {
                var r = {error:'The JWT is no longer valid', jwtToken: ''};
                res.status(200).json(r);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        const newCard = {Card:card,UserId:userId};
        var error = '';
        try
        {
            const db = client.db('COP4331Cards');
            const result = db.collection('Cards').insertOne(newCard);
        }
        catch(e)
        {
            error = e.toString();
        }

        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(jwtToken);
        }
        catch(e)
        {
            console.log(e.message);
        }
        
        var ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    app.post('/api/seed', async (req, res, next) =>
    {
        // Seed the database with initial card list
        var error = '';
        var count = 0;
        try
        {
            const db = client.db('COP4331Cards');
            const cardsCollection = db.collection('Cards');
            
            // Clear existing cards
            await cardsCollection.deleteMany({});
            
            // Insert all cards from cardList
            const cardsData = cardList.map(card => ({ Card: card }));
            const result = await cardsCollection.insertMany(cardsData);
            count = result.insertedCount;
        }
        catch(e)
        {
            error = e.toString();
        }

        res.status(200).json({ error: error, count: count });
    });

    app.post('/api/searchcards', async (req, res, next) =>
    {
        // incoming: userId, search
        // outgoing: results[], error
        var error = '';

        const { userId, search, jwtToken } = req.body;
        try
        {
            if( token.isExpired(jwtToken))
            {
                var r = {error:'The JWT is no longer valid', jwtToken: ''};
                res.status(200).json(r);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        var _search = search.trim();
        const db = client.db('COP4331Cards');
        const results = await db.collection('Cards').find({"Card":{$regex:_search+'.*',
        $options:'i'}}).toArray();

        var _ret = [];
        for( var i=0; i<results.length; i++ )
        {
            _ret.push( results[i].Card );
        }

        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(jwtToken);
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = { results:_ret, error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

/// User APIs ///

    app.post('/api/register', async (req, res, next) =>
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
            const db = client.db('COP4331Cards');
            const users = db.collection('Users');
            const existingUser = await users.findOne({ Login: login });
            const existingEmail = await users.findOne({ Email: email });

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

            const lastUser = await users.find({ UserID: { $exists: true } }).sort({ UserID: -1 }).limit(1).toArray();
            const nextUserId = lastUser.length > 0 ? (lastUser[0].UserID + 1) : 1;
            const hashedPassword = await hashPassword(password);

            const verificationToken = createVerificationToken();
            const verificationTokenHash = hashVerificationToken(verificationToken);
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await users.insertOne({
                UserID: nextUserId,
                FirstName: firstName,
                LastName: lastName,
                Login: login,
                Password: hashedPassword,
                Email: email,
                IsEmailVerified: false,
                VerificationTokenHash: verificationTokenHash,
                VerificationTokenExpires: verificationTokenExpires
            });

            await sendVerificationEmail(email, verificationToken);
        }
        catch(e)
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

    app.post('/api/login', async (req, res, next) =>
    {
        // incoming: login, password
        // outgoing: id, firstName, lastName, error
        const { login, password } = req.body;

        const db = client.db('COP4331Cards');
        const users = db.collection('Users');
        const user = await users.findOne({ Login: login });
        var ret;

        if( user )
        {
            const matchesPassword = await verifyPassword(password, user.Password);
            if (!matchesPassword)
            {
                ret = {error:'Login/Password incorrect'};
                res.status(200).json(ret);
                return;
            }

            if (!isBcryptHash(user.Password))
            {
                const upgradedHash = await hashPassword(password);
                await users.updateOne(
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
                const token = require("./createJWT.js");
                ret = token.createToken( fn, ln, id );
            }
            catch(e)
            {
                ret = {error:e.message};
            }
        }
        else
        {
            ret = {error:"Login/Password incorrect"};
        }

        //var ret = { id:id, firstName:fn, lastName:ln, error:''};
        res.status(200).json(ret);
    });

    app.post('/api/verify-email', async (req, res, next) =>
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
            const db = client.db('COP4331Cards');
            const users = db.collection('Users');
            const tokenHash = hashVerificationToken(token);

            const result = await users.updateOne(
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

    app.post('/api/resend-verification', async (req, res, next) =>
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
            const db = client.db('COP4331Cards');
            const users = db.collection('Users');

            const user = await users.findOne({
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

            await users.updateOne(
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

    app.post('/api/getuser', async (req, res, next) =>
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
        const db = client.db('COP4331Cards');
        const user = await db.collection('Users').findOne(
        { UserID: userId },
        { projection: { _id: 0, Password: 0 } }
        );

        if (!user)
        {
        res.status(200).json({ error: 'User not found.' });
        return;
        }

        res.status(200).json({ user: user, error: '' });
    }
    catch (e)
    {
        error = e.toString();
        res.status(200).json({ error: error });
    }
    });

    app.post('/api/edituser', async (req, res, next) =>
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
        const db = client.db('COP4331Cards');
        const users = db.collection('Users');
        const hashedPassword = await hashPassword(password);

        const existingUser = await users.findOne({
        Login: login,
        UserID: { $ne: userId }
        });

        if (existingUser)
        {
        res.status(200).json({ error: 'Username already exists.' });
        return;
        }

        const result = await users.updateOne(
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

    app.post('/api/deleteuser', async (req, res, next) =>
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
        const db = client.db('COP4331Cards');
        const result = await db.collection('Users').deleteOne({ UserID: userId });

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


}