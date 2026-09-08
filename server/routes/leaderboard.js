const express = require('express');
const router = express.Router();
const { Leaderboard } = require('../models/models');

const adminOnly = (req, res, next) => {
    if (req.user && req.user.isAdmin === true) {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admins only." });
    }
};

/**
 * @swagger
 * /leaderboard:
 *   get:
 *     summary: Get top leaderboard entries
 *     description: Fetches the top 50 fastest lap times, sorted in ascending order, populated with track, driver, and car details.
 *     responses:
 *       200:
 *         description: Returns an array of leaderboard entries
 *       500:
 *         description: Failed to fetch leaderboard
 */
router.get('/', async (req, res) => {
    try {
        // Fetch top 50 scores, sorted by bestTime (ascending - fastest first)
        const leaderboard = await Leaderboard.find()
            .populate('trackId', 'name')
            .populate('driverId', 'username')
            .populate('carId', 'make model carRank')
            .sort({ bestTime: 1 }) 
            .limit(50); 
            
        res.json(leaderboard);
    } catch (err) {
        console.error("Leaderboard fetch error:", err);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

module.exports = router;