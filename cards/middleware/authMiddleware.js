const jwt = require('jsonwebtoken');

function extractBearerToken(authorizationHeader)
{
    if (!authorizationHeader || typeof authorizationHeader !== 'string')
    {
        return '';
    }

    const parts = authorizationHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer')
    {
        return parts[1];
    }

    return '';
}

module.exports = function authMiddleware(req, res, next)
{
    const bodyToken = req.body && typeof req.body.jwtToken === 'string' ? req.body.jwtToken : '';
    const headerToken = extractBearerToken(req.headers.authorization);
    const jwtToken = bodyToken || headerToken;

    if (!jwtToken)
    {
        res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
        return;
    }

    try
    {
        const decoded = jwt.verify(jwtToken, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        req.jwtToken = jwtToken;
        next();
    }
    catch (e)
    {
        res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
    }
};