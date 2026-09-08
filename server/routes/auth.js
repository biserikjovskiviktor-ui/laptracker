const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/models');
const { authenticate } = require('../middleware/auth');
// Use a fallback for JWT_SECRET to prevent server crashes if env is not set
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with username, email, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields or email already registered
 *       500:
 *         description: Registration failed
 */
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, email, password: hashedPassword });
        
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Registration error:", err); // Log for debugging
        res.status(500).json({ error: "Registration failed" });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in an existing user
 *     description: Authenticates user credentials and returns a JWT token along with role details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns token and user info
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Login process failed
 */
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin }, // isAdmin is here
            JWT_SECRET,
            { expiresIn: '24h' }
        );
            
            res.json({ 
                token, 
                isAdmin: user.isAdmin, 
                userId: user._id, 
                email: user.email 
            });
        } else {
            res.status(401).json({ error: "Invalid email or password" });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login process failed" });
    }
});

/**
 * @swagger
 * /auth/user/{userid}:
 *   get:
 *     summary: Get user profile by ID
 *     description: Fetches user details (excluding password) given a valid JWT token.
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
 *         description: Returns the user profile object
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user/:userid', authenticate, async (req, res) => {
    try {
        // req.user.id is attached by your authenticateToken middleware
        const user = await User.findOne({ _id: req.params.userid }).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Successfully returns the user profile
        res.json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;