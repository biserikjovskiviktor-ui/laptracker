const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Track } = require('../models/models');

// Authentication middleware
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
 * /tracks:
 *   get:
 *     summary: Get all tracks
 *     description: Fetches a list of all tracks, populated with the creator's username.
 *     responses:
 *       200:
 *         description: Returns an array of tracks
 *       500:
 *         description: Failed to fetch tracks
 */
router.get('/', async (req, res) => {
    try {
        const tracks = await Track.find().populate('createdBy', 'username');
        res.json(tracks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tracks" });
    }
});

/**
 * @swagger
 * /tracks/{id}:
 *   get:
 *     summary: Get track by ID
 *     description: Fetches details for a specific track by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The track ID
 *     responses:
 *       200:
 *         description: Returns track details
 *       500:
 *         description: Failed to fetch track
 */
router.get('/:id', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id).populate('location', 'countryCode');
        res.json(track);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch track" });
    }
});

/**
 * @swagger
 * /tracks:
 *   post:
 *     summary: Create a new track
 *     description: Submits a new track into the database. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - countryCode
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               length:
 *                 type: number
 *               surface:
 *                 type: string
 *     responses:
 *       201:
 *         description: Returns the newly created track object
 *       400:
 *         description: Missing required fields or error message
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, location, countryCode, length, surface } = req.body;

        if (!name || !location || !countryCode) {
            return res.status(400).json({ error: "Name, Location, and Country Code are required" });
        }

        const newTrack = new Track({ 
            name, 
            location,
            countryCode, 
            length, 
            surface, 
            createdBy: req.user.userId // Set from the token, not the body
        });
        
        await newTrack.save();
        res.status(201).json(newTrack);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /tracks/{id}:
 *   delete:
 *     summary: Delete a track
 *     description: Deletes a specific track if the authenticated user is the owner or an admin. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The track ID
 *     responses:
 *       200:
 *         description: Track deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Unauthorized: You don't have permission
 *       404:
 *         description: Track not found
 *       500:
 *         description: Server error during deletion
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        console.log("Attempting to delete track ID:", req.params.id);
        
        const track = await Track.findById(req.params.id);
        if (!track) return res.status(404).json({ error: "Track not found" });

        // Check if the user is the owner OR an admin
        // Note: ensure 'createdBy' matches the field name in your Track model
        const isOwner = track.createdBy?.toString() === req.user.userId;
        const isAdmin = req.user.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Unauthorized: You don't have permission" });
        }

        await track.deleteOne();
        res.json({ message: "Track deleted successfully" });
    } catch (err) {
        // This log will print the exact reason for the 500 error to your terminal
        console.error("SERVER ERROR:", err); 
        res.status(500).json({ error: "Server error during deletion" });
    }
});

module.exports = router;