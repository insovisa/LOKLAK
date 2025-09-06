const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Get current date for log file naming
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Format timestamp for log entries
function getTimestamp() {
    return new Date().toISOString();
}

// Write log to file
function writeLog(level, message, error = null) {
    const timestamp = getTimestamp();
    const logFile = path.join(logsDir, `bot-${getCurrentDate()}.log`);
    
    let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (error) {
        logEntry += `\nError: ${error.message}`;
        if (error.stack) {
            logEntry += `\nStack: ${error.stack}`;
        }
    }
    
    logEntry += '\n';
    
    // Append to log file
    fs.appendFileSync(logFile, logEntry);
}

// Console colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

const logger = {
    info: (message) => {
        console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`);
        writeLog('info', message);
    },
    
    warn: (message) => {
        console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`);
        writeLog('warn', message);
    },
    
    error: (message, error = null) => {
        console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
        if (error) {
            console.error(error);
        }
        writeLog('error', message, error);
    },
    
    success: (message) => {
        console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
        writeLog('success', message);
    },
    
    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`${colors.magenta}[DEBUG]${colors.reset} ${message}`);
            writeLog('debug', message);
        }
    }
};

module.exports = logger;
