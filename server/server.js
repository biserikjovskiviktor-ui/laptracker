require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// 1. Middleware
// Allow only your client container to communicate with the server
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true
}));
app.use(express.json());

// 2. Import Routes
const authRoutes = require('./routes/auth');
const trackRoutes = require('./routes/tracks');
const vehicleRoutes = require('./routes/vehicles');
const runRoutes = require('./routes/runs');
const dbRoutes = require('./routes/db');
const leaderboardRoutes = require('./routes/leaderboard');
const profileRoutes = require('./routes/profile');

app.get('/api/external-countries', async (req, res) => {
    try {
        // Pulls a completely free, static, open-source JSON file of the world's countries
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-countries@5/countries.json');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch static country list: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Map the fields to match what your frontend component expects ({ name: { common: ... }, cca2: ... })
        const countries = data.map(c => ({
            name: {
                common: c?.name?.common || c?.name || ''
            },
            cca2: c?.cca2 || ''
        })).filter(c => c.name.common && c.cca2);
        
        // Sort alphabetically
        countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
        
        res.json(countries);
    } catch (err) {
        console.error("Backend proxy error fetching countries:", err.message);
        res.status(500).json({ error: err.message });
    }
});
app.get('/api', (req, res) => {
    res.json({ 
        message: "Welcome to the LapTracker API!", 
        documentation: "Visit /api/docs for the interactive Swagger UI",
        spec: "Visit /api/swagger.json for the raw OpenAPI specification"
    });
});

// 3. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/runs', runRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);

// --- Swagger Documentation Setup ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LapTracker API Documentation',
      version: '1.0.0',
      description: 'API endpoints for managing users, tracks, vehicles, runs, and leaderboards.',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
      },
    ],
  },
  apis: ['./routes/*.js'], // Scans your route files for JSDoc descriptions
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Required raw OpenAPI spec endpoint
app.get('/api/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Required interactive Swagger UI documentation GUI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// ------------------------------------

// 4. Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/laptracker';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        // Use port 5000 so it doesn't conflict with React (port 3000)
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('Database connection error:', err));