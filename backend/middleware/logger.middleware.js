const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Custom Morgan format for detailed logging
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Create a write stream for logging to file
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
);

// Error log stream
const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'),
    { flags: 'a' }
);

// Morgan middleware for request logging
const requestLogger = morgan(morganFormat, { stream: accessLogStream });

// Custom error logger
const errorLogger = (err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const errorLog = `${timestamp} | ${req.method} ${req.path} | Status: ${res.statusCode} | Error: ${err.message}\n`;
    errorLogStream.write(errorLog);
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    next(err);
};

module.exports = { requestLogger, errorLogger };
