const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true },
        title: { type: String, required: true },
        poster_path: { type: String, default: '' },
        release_date: { type: String, default: '' },
        director: { type: String, default: '' },
        genres: { type: [String], default: [] },
        userRating: { type: Number, min: 1, max: 5, default: null }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        UserID: { type: Number, required: true, unique: true, index: true },
        FirstName: { type: String, required: true },
        LastName: { type: String, required: true },
        Login: { type: String, required: true, unique: true, index: true },
        Password: { type: String, required: true },
        Email: { type: String, required: true, unique: true, index: true },
        IsEmailVerified: { type: Boolean, default: false },
        VerificationTokenHash: { type: String, default: null },
        VerificationTokenExpires: { type: Date, default: null },
        watchList: { type: [movieSchema], default: [] },
        watchedMovies: { type: [movieSchema], default: [] }
    },
    {
        collection: 'Users',
        versionKey: false
    }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
