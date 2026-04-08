const express = require('express');
const mongoose = require('mongoose');
const token = require('../createJWT.js');
const authMiddleware = require('../middleware/authMiddleware');

module.exports = function createCardRoutes(cardList)
{
    const router = express.Router();
    router.use(authMiddleware);

    router.post('/addcard', async (req, res, next) =>
    {
        // incoming: userId, color
        // outgoing: error
        const { userId, card } = req.body;

        const newCard = { Card: card, UserId: userId };
        var error = '';
        try
        {
            const cardsCollection = mongoose.connection.db.collection('Cards');
            await cardsCollection.insertOne(newCard);
        }
        catch (e)
        {
            error = e.toString();
        }

        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(req.jwtToken);
        }
        catch (e)
        {
            console.log(e.message);
        }

        var ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    router.post('/seed', async (req, res, next) =>
    {
        // Seed the database with initial card list
        var error = '';
        var count = 0;
        try
        {
            const cardsCollection = mongoose.connection.db.collection('Cards');

            // Clear existing cards
            await cardsCollection.deleteMany({});

            // Insert all cards from cardList
            const cardsData = cardList.map(card => ({ Card: card }));
            const result = await cardsCollection.insertMany(cardsData);
            count = result.insertedCount;
        }
        catch (e)
        {
            error = e.toString();
        }

        res.status(200).json({ error: error, count: count });
    });

    router.post('/searchcards', async (req, res, next) =>
    {
        // incoming: userId, search
        // outgoing: results[], error
        var error = '';

        const { userId, search } = req.body;

        var _search = search.trim();
    const cardsCollection = mongoose.connection.db.collection('Cards');
    const results = await cardsCollection.find({ "Card": { $regex: _search + '.*', $options: 'i' } }).toArray();

        var _ret = [];
        for (var i = 0; i < results.length; i++)
        {
            _ret.push(results[i].Card);
        }

        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(req.jwtToken);
        }
        catch (e)
        {
            console.log(e.message);
        }

        var ret = { results: _ret, error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    return router;
};
