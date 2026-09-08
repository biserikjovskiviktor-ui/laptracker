const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Vehicle } = require('../models/models');

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

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Get all vehicles for authenticated user
 *     description: Fetches a list of vehicles belonging to the authenticated user. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns an array of vehicles
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch vehicles
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ userId: req.user.userId }); // Changed from owner to userId
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch vehicles" });
    }
});

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     description: Submits a new vehicle linked to the authenticated user. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - model
 *               - hp
 *             properties:
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: number
 *               hp:
 *                 type: number
 *               engineDisplacement:
 *                 type: number
 *               carRank:
 *                 type: string
 *     responses:
 *       201:
 *         description: Returns the newly created vehicle object
 *       400:
 *         description: Missing required fields or error message
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { make, model, year, hp, engineDisplacement, carRank } = req.body;
        
        if (!make || !model || !hp) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newVehicle = new Vehicle({
            make, 
            model, 
            year, 
            hp,
            engineDisplacement, 
            carRank,
            userId: req.user.userId // Changed from owner to userId to align with profile queries
        });

        await newVehicle.save();
        res.status(201).json(newVehicle);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle
 *     description: Deletes a specific vehicle if the authenticated user is the owner or an admin. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The vehicle ID
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Unauthorized (User is neither owner nor admin)
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        
        if (!vehicle) return res.status(404).json({ error: "Not found" });

        const isOwner = vehicle.userId?.toString() === req.user.userId; // Updated check
        const isAdmin = req.user.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await vehicle.deleteOne();
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;