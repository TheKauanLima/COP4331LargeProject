const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () =>
{
    process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'test-secret';

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
        dbName: 'filmbuff-test'
    });
});

afterEach(async () =>
{
    const collections = mongoose.connection.collections;

    for (const key of Object.keys(collections))
    {
        await collections[key].deleteMany({});
    }
});

afterAll(async () =>
{
    await mongoose.disconnect();

    if (mongoServer)
    {
        await mongoServer.stop();
    }
});
