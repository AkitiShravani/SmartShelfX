// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log error details
    console.error({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status,
        message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });

    // Handle specific error types
    if (err.name === 'SequelizeUniqueConstraintError') {
        const field = err.errors?.[0]?.path || 'field';
        return res.status(409).json({
            success: false,
            message: `${field} is already in use`,
            errors: [{ field, message: `${field} is already in use` }]
        });
    }

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    if (err.name === 'SequelizeConnectionError') {
        return res.status(503).json({
            success: false,
            message: 'Database connection error',
            error: process.env.NODE_ENV === 'development' ? message : 'Service temporarily unavailable'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired. Please login again.'
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            success: false,
            message: 'Service unavailable. Please try again later.'
        });
    }

    // Generic error response
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.path}`
    });
};

module.exports = { errorHandler, notFoundHandler };
