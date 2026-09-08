const express = require('express');
const router = express.Router();
const { User, Vehicle, Track, Run } = require('../models/models');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /profile/{userid}:
 *   get:
 *     summary: Get consolidated user profile data
 *     description: Fetches a user's details, vehicles, created tracks, and completed runs concurrently. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userid
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Returns consolidated profile data (user, vehicles, tracks, runs)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error fetching profile data
 */
// GET consolidated profile data
router.get('/:userid', authenticate, async (req, res) => {
    try {
        const userId = req.params.userid;

        // Fetch user info excluding the password
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch user's related items concurrently
        const [vehicles, tracks, runs] = await Promise.all([
            Vehicle.find({ userId }),
            Track.find({ createdBy: userId }), // <-- Changed from userId to createdBy
            Run.find({ userId }).populate('trackId').populate('carId')
        ]);

        res.json({
            user,
            vehicles,
            tracks,
            runs
        });
    } catch (err) {
        console.error("Error fetching comprehensive profile:", err);
        res.status(500).json({ error: "Server error fetching profile data" });
    }
});

module.exports = router;