require('express');
require('mongodb');

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
        // incoming: firstName, lastName, login, password
        // outgoing: error
        var error = '';
        const { firstName, lastName, login, password } = req.body;

        if (!firstName || !lastName || !login || !password)
        {
            res.status(200).json({ error: 'All fields are required.' });
            return;
        }

        try
        {
            const db = client.db('COP4331Cards');
            const users = db.collection('Users');
            const existingUser = await users.findOne({ Login: login });

            if (existingUser)
            {
                res.status(200).json({ error: 'Username already exists.' });
                return;
            }

            const lastUser = await users.find({ UserID: { $exists: true } }).sort({ UserID: -1 }).limit(1).toArray();
            const nextUserId = lastUser.length > 0 ? (lastUser[0].UserID + 1) : 1;

            await users.insertOne({
                UserID: nextUserId,
                FirstName: firstName,
                LastName: lastName,
                Login: login,
                Password: password
            });
        }
        catch(e)
        {
            error = e.toString();
        }

        res.status(200).json({ error: error });
    });

    app.post('/api/login', async (req, res, next) =>
    {
        // incoming: login, password
        // outgoing: id, firstName, lastName, error
        var error = '';

        const { login, password } = req.body;

        const db = client.db('COP4331Cards');
        const results = await
        db.collection('Users').find({Login:login,Password:password}).toArray();

        var id = -1;
        var fn = '';
        var ln = '';

        if( results.length > 0 )
        {
            id = results[0].UserID;
            fn = results[0].FirstName;
            ln = results[0].LastName;

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
            Password: password
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