require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');

const { sequelize } = require('./config/database');

// Import middleware
const { corsMiddleware } = require('./middleware/cors.middleware');
const { requestLogger, errorLogger } = require('./middleware/logger.middleware');
const { generalLimiter, authLimiter, createLimiter } = require('./middleware/rateLimiter.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const transactionRoutes = require('./routes/transaction.routes');
const forecastRoutes = require('./routes/forecast.routes');
const orderRoutes = require('./routes/order.routes');
const alertRoutes = require('./routes/alert.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const { startPOScheduler } = require('./utils/poScheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

// Add security headers using Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'fonts.gstatic.com'],
            connectSrc: [
                "'self'",
                // Local development
                'http://localhost:*',
                'http://127.0.0.1:*',
                // Production Railway URLs
                'https://smartshelfx-production.up.railway.app',
                'https://smartshelfx-frontend-production.up.railway.app',
                'https://*.up.railway.app'
            ]
        }
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS middleware with restricted origins
app.use(corsMiddleware);
app.options('*', corsMiddleware);

// ═══════════════════════════════════════════════════════════════════════════
// BODY PARSER MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

app.use(requestLogger);

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// Stricter rate limiting for auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Rate limiting for create operations
app.post('/api/products', createLimiter);
app.post('/api/orders', createLimiter);
app.post('/api/transactions', createLimiter);

// ═══════════════════════════════════════════════════════════════════════════
// STATIC FILE SERVING & FAVICON
// ═══════════════════════════════════════════════════════════════════════════

const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist', 'smartshelfx', 'browser');
const frontendExists = fs.existsSync(frontendDistPath);
console.log('[Server] frontendDistPath =', frontendDistPath);
console.log('[Server] frontend exists =', frontendExists);
if (frontendExists) {
    app.use(express.static(frontendDistPath));
}

app.get('/favicon.ico', (req, res) => {
    if (frontendExists) {
        res.sendFile(path.join(frontendDistPath, 'favicon.ico'));
    } else {
        const faviconPath = path.join(__dirname, 'favicon.ico');
        if (fs.existsSync(faviconPath)) {
            res.sendFile(faviconPath);
        } else {
            res.status(204).end();
        }
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK & API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        service: 'SmartShelfX API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// FRONTEND SPA ROUTES (if build exists)
// ═══════════════════════════════════════════════════════════════════════════

if (frontendExists) {
    app.get('/', (req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
    
    // SPA fallback: serve index.html for non-API routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendDistPath, 'index.html'));
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING MIDDLEWARE (Must be last)
// ═══════════════════════════════════════════════════════════════════════════

app.use(errorLogger);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');
        await sequelize.sync({ alter: false });
        console.log('✅ Models synced.');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ SmartShelfX API running on http://localhost:${PORT}`);
            console.log(`   Health check: http://localhost:${PORT}/api/health`);
            startPOScheduler();
        });
    } catch (err) {
        console.error('❌ Startup failed:', err.message);
        process.exit(1);
    }
};

start();