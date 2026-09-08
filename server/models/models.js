const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
}));

const Track = mongoose.model('Track', new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    countryCode: { type: String, required: true },
    length: { type: Number, required: true, min: 0 },
    surface: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}));

const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true, min: 1886 }, // First car invented in 1886
    engineDisplacement: { type: Number, required: true, min: 0 },
    hp: { type: Number, required: true, min: 1 },
    carRank: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}));

const Run = mongoose.model('Run', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    runTime: { type: Number, required: true, min: 0 },
    weatherInfo: { type: Object, required: true }
}, { timestamps: true }));

const leaderboardSchema = new mongoose.Schema({
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    bestTime: { type: Number, required: true },
    runId: { type: mongoose.Schema.Types.ObjectId, ref: 'Run', required: true }
});
// Critical: Prevents duplicate leaderboard entries for the same driver on the same track
leaderboardSchema.index({ trackId: 1, driverId: 1 }, { unique: true });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = { User, Track, Vehicle, Run, Leaderboard };