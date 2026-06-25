const cors = require('cors');

// Define allowed origins - can be configured via environment variable
const getAllowedOrigins = () => {
    const envOrigins = process.env.ALLOWED_ORIGINS;
    if (envOrigins) {
        return envOrigins.split(',').map(origin => origin.trim());
    }
    
    // Default allowed origins for development and production
    return [
        // Local development
        'http://localhost:3000',
        'http://localhost:4200',
        'http://localhost:4201',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:4200',
        'http://127.0.0.1:4201',
        // Production Railway URLs
        'https://smartshelfx-production.up.railway.app',
        'https://smartshelfx-frontend-production.up.railway.app',
        // Allow Railway deployment preview domains
        /\.up\.railway\.app$/
    ];
};

// Configure CORS with restricted origins
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = getAllowedOrigins();
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
    maxAge: 3600, // Pre-flight request cache 1 hour
    optionsSuccessStatus: 200
};

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

module.exports = { corsMiddleware, corsOptions };
