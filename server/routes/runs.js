const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Run, Leaderboard } = require('../models/models');

// Simple Auth Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.isAdmin === true) {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admins only." });
    }
};

/**
 * @swagger
 * /runs:
 *   get:
 *     summary: Get all runs
 *     description: Fetches all completed runs sorted by creation date descending, populated with user, track, car, and weather details.
 *     responses:
 *       200:
 *         description: Returns an array of runs
 *       500:
 *         description: Failed to fetch runs
 */
router.get('/', async (req, res) => {
    try {
        const runs = await Run.find()
            .populate('userId', 'username')
            .populate('trackId', 'name')
            .populate('carId', 'make model carRank')
            .populate('weatherInfo')
            .sort({ createdAt: -1 });
        res.json(runs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch runs" });
    }
});

/**
 * @swagger
 * /runs/pb/{trackId}/{carId}:
 *   get:
 *     summary: Get personal best for a track and vehicle
 *     description: Fetches the lowest run time for the authenticated user on a specific track and car combination. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *         description: The track ID
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *         description: The car ID
 *     responses:
 *       200:
 *         description: Returns the best time or null if no runs exist
 *       401:
 *         description: Unauthorized or invalid token
 *       500:
 *         description: Failed to fetch PB
 */
router.get('/pb/:trackId/:carId', authenticate, async (req, res) => {
    try {
        const { trackId, carId } = req.params;
        const userId = req.user.userId;

        // Find the run with the lowest 'runTime' for this user/track/car combo
        const bestRun = await Run.findOne({ 
            userId, 
            trackId, 
            carId 
        }).sort({ runTime: 1 }); // Sort ascending: smallest time first

        if (bestRun) {
            res.json({ bestTime: bestRun.runTime });
        } else {
            res.json({ bestTime: null });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch PB" });
    }
});

/**
 * @swagger
 * /runs/{id}:
 *   get:
 *     summary: Get run by ID
 *     description: Fetches specific run details populated with user, track (name, location, countryCode), car, and weather info. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The run ID
 *     responses:
 *       200:
 *         description: Returns the run details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Run not found
 *       500:
 *         description: Failed to fetch run details
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const run = await Run.findById(req.params.id)
            .populate('userId', 'username')
            .populate('trackId', 'name location countryCode')
            .populate('carId', 'make model carRank ')
            .populate('weatherInfo');

        if (!run) {
            return res.status(404).json({ error: "Run not found" });
        }
        res.json(run);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch run details" });
    }
});

/**
 * @swagger
 * /runs/details/{id}:
 *   get:
 *     summary: Get detailed run information by ID
 *     description: Fetches comprehensive run details with full track specifications and vehicle attributes. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The run ID
 *     responses:
 *       200:
 *         description: Returns comprehensive run details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Run not found
 *       500:
 *         description: Failed to fetch run details
 */
router.get('/details/:id', authenticate, async (req, res) => {
    try {
        const run = await Run.findById(req.params.id)
            .populate('userId', 'username')
            .populate('trackId', 'name location countryCode length surface')
            .populate('carId', 'make model year engineDisplacement hp carRank')
            .populate('weatherInfo');
        if (!run) {
            return res.status(404).json({ error: "Run not found" });
        }
        res.json(run);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch run details" });
    }
});

/**
 * @swagger
 * /runs/{id}:
 *   delete:
 *     summary: Delete a run
 *     description: Deletes a specific run if owned by the user or if user is an admin. Automatically updates or removes associated leaderboard entries. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The run ID
 *     responses:
 *       200:
 *         description: Successfully deleted run and updated leaderboard fallback
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied. You can only delete your own runs.
 *       404:
 *         description: Run not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const runId = req.params.id;
        const userId = req.user.userId;
        const isAdmin = req.user.isAdmin;

        // Find the run first to verify ownership/track details
        const run = await Run.findById(runId);
        if (!run) {
            return res.status(404).json({ error: "Run not found" });
        }

        // Check if the logged-in user owns this run OR is an admin
        if (run.userId.toString() !== userId && !isAdmin) {
            return res.status(403).json({ error: "Access denied. You can only delete your own runs." });
        }

        const { trackId, userId: runUserId } = run;

        // 1. Delete the actual run
        await Run.findByIdAndDelete(runId);
        
        // 2. Check if the deleted run was the one currently holding the leaderboard spot
        const currentLbEntry = await Leaderboard.findOne({ trackId, driverId: runUserId });
        
        if (currentLbEntry && currentLbEntry.runId.toString() === runId) {
            // 3. Find the NEXT best remaining run for this user on this track
            const nextBestRun = await Run.findOne({ 
                userId: runUserId, 
                trackId: trackId 
            }).sort({ runTime: 1 }); // Sort ascending to get the lowest/fastest time

            if (nextBestRun) {
                // Fallback: Update leaderboard with the second-best run
                await Leaderboard.findOneAndUpdate(
                    { trackId, driverId: runUserId },
                    { 
                        bestTime: nextBestRun.runTime, 
                        carId: nextBestRun.carId, 
                        runId: nextBestRun._id 
                    },
                    { new: true }
                );
            } else {
                // If no runs are left at all for this user on this track, remove the leaderboard entry
                await Leaderboard.deleteOne({ trackId, driverId: runUserId });
            }
        }

        res.json({ message: "Successfully deleted run and updated leaderboard fallback" });
    } catch (err) {
        console.error("Delete run error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @swagger
 * /runs/user/{userId}:
 *   get:
 *     summary: Get runs by user ID with optional filters
 *     description: Fetches runs for a specific user, with optional query parameters to filter by carId or trackId. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *       - in: query
 *         name: carId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by vehicle ID
 *       - in: query
 *         name: trackId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by track ID
 *     responses:
 *       200:
 *         description: Returns an array of filtered runs
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch filtered runs
 */
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const { carId, trackId } = req.query;
        let query = { userId: req.params.userId };

        if (carId) query.carId = carId;
        if (trackId) query.trackId = trackId;

        const runs = await Run.find(query)
            .populate('trackId', 'name')
            .populate('carId', 'model make')
            .populate('weatherInfo')
            .sort({ createdAt: -1 });
        res.json(runs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch filtered runs" });
    }
});

/**
 * @swagger
 * /runs:
 *   post:
 *     summary: Create a new run
 *     description: Submits a new lap time run for the authenticated user and automatically updates the leaderboard if it is a personal best. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackId
 *               - carId
 *               - runTime
 *               - weatherInfo
 *             properties:
 *               trackId:
 *                 type: string
 *               carId:
 *                 type: string
 *               runTime:
 *                 type: number
 *               weatherInfo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Returns the newly created run object
 *       400:
 *         description: Missing required fields or error message
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { trackId, carId, runTime, weatherInfo } = req.body;
        const userId = req.user.userId; // Use ID from JWT, not from body

        if (!trackId || !carId || !runTime || !weatherInfo) {
            console.log("Missing fields:", { trackId, carId, runTime, weatherInfo });
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1. Create and Save the Run
        const newRun = new Run({ userId, trackId, carId, runTime, weatherInfo });
        await newRun.save();

        // 2. Automated Leaderboard Update
        const bestEntry = await Leaderboard.findOne({ driverId: userId, trackId: trackId });

        if (!bestEntry || runTime < bestEntry.bestTime) {
            await Leaderboard.findOneAndUpdate(
                { driverId: userId, trackId: trackId },
                { bestTime: runTime, carId: carId, runId: newRun._id },
                { upsert: true, new: true }
            );
        }

        res.status(201).json(newRun);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;