const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Track, Vehicle, Run, Leaderboard } = require('../models/models');
const { authenticate } = require('../middleware/auth');

// Middleware to verify Admin
const adminOnly = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied: Admins only" });
    }
    next();
};

/**
 * @swagger
 * /db/reset:
 *   post:
 *     summary: Reset/wipe the database
 *     description: Clears all records from User, Track, Vehicle, Run, and Leaderboard collections (useful for showcases).
 *     responses:
 *       200:
 *         description: Database wiped successfully
 *       500:
 *         description: Reset failed
 */
router.post('/reset', async (req, res) => {
    try {
        await Promise.all([
            User.deleteMany({}),
            Track.deleteMany({}),
            Vehicle.deleteMany({}),
            Run.deleteMany({}),
            Leaderboard.deleteMany({})
        ]);
        res.json({ message: "Database wiped successfully" });
    } catch (err) {
        res.status(500).json({ error: "Reset failed: " + err.message });
    }
});

/**
 * @swagger
 * /db/seed:
 *   post:
 *     summary: Seed the database
 *     description: Wipes existing collections and populates them with initial mock data (Admin, User, Tracks, Vehicles, Runs, Leaderboard).
 *     responses:
 *       200:
 *         description: Database seeded successfully
 *       500:
 *         description: Seeding error or server failure
 */
router.post('/seed', async (req, res) => {
    try {
        // 1. Wipe existing data first for a clean slate
        await Promise.all([
            User.deleteMany({}),
            Track.deleteMany({}),
            Vehicle.deleteMany({}),
            Run.deleteMany({}),
            Leaderboard.deleteMany({})
        ]);

        const hashedPassword = await bcrypt.hash("123456", 10);

        // 2. Create Admin Account
        const adminUser = await User.create({ 
            username: "admin", 
            email: "admin@laptracker.com", 
            password: hashedPassword, 
            isAdmin: true 
        });

        // 3. Create Regular User Account
        const regularUser = await User.create({
            username: "user",
            email: "user@laptracker.com",
            password: hashedPassword,
            isAdmin: false
        });

        // 4. Create Tracks
        const track1 = await Track.create({ 
            name: "Mt. Haruna", 
            location: "Gunma, Japan", 
            countryCode: "JP",
            length: 5.2, 
            surface: "Asphalt",
            createdBy: adminUser._id 
        });

        const track2 = await Track.create({ 
            name: "Zolder Circuit", 
            location: "Heusden-Zolder, Belgium", 
            countryCode: "BE",
            length: 4.0, 
            surface: "Asphalt",
            createdBy: regularUser._id 
        });

        // 5. Create Vehicles
        const vehicle1 = await Vehicle.create({ 
            make: "Toyota", 
            model: "AE86 Trueno", 
            year: 1985, 
            engineDisplacement: 1.6, 
            hp: 130, 
            carRank: "E", 
            userId: adminUser._id 
        });

        const vehicle2 = await Vehicle.create({ 
            make: "Honda", 
            model: "Civic", 
            year: 1998, 
            engineDisplacement: 2.4, 
            hp: 201, 
            carRank: "D", 
            userId: regularUser._id 
        });

        // 6. Create Runs
        const run1 = await Run.create({
            userId: adminUser._id,
            trackId: track1._id,
            carId: vehicle1._id,
            runTime: 245300, 
            weatherInfo: "Clear, 22°C" // Matches app string format
        });

        const run2 = await Run.create({
            userId: regularUser._id,
            trackId: track2._id,
            carId: vehicle2._id,
            runTime: 189400, 
            weatherInfo: "Overcast, 18°C" // Matches app string format
        });

        // 7. Seed Leaderboard Entries
        await Leaderboard.create([
            {
                trackId: track1._id,
                driverId: adminUser._id,
                carId: vehicle1._id,
                bestTime: 245300,
                runId: run1._id
            },
            {
                trackId: track2._id,
                driverId: regularUser._id,
                carId: vehicle2._id,
                bestTime: 189400,
                runId: run2._id
            }
        ]);

        res.json({ message: "Database seeded successfully with admin, user, tracks, vehicles, and runs!" });
    } catch (err) {
        console.error("Seeding error:", err);
        res.status(500).json({ error: err.message, details: err.errors });
    }
});

/**
 * @swagger
 * /db/data:
 *   get:
 *     summary: Get admin dashboard data
 *     description: Fetches all users, vehicles, tracks, and populated runs. Restricted to admin users only.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns all dashboard documents
 *       403:
 *         description: Access denied (Admins only)
 *       500:
 *         description: Failed to fetch admin dashboard data
 */
router.get('/data', authenticate, adminOnly, async (req, res) => {
    try {
        const [users, vehicles, tracks, runs] = await Promise.all([
            User.find(),
            Vehicle.find(),
            Track.find(),
            Run.find().populate('userId').populate('trackId').populate('carId')
        ]);
        res.json({ users, vehicles, tracks, runs });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch admin dashboard data" });
    }
});

module.exports = router;