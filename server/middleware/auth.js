// middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) return res.status(401).json({ error: "Access denied" });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // This now contains userId and isAdmin!
        console.log("Authenticated User:", req.user);
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid token" });
    }
};

module.exports = { authenticate };