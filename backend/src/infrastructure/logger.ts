import winston from 'winston';

const { combine, timestamp, json, colorize, printf } = winston.format;

// Custom format for local development (pretty print)
const localFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message} `;
    if (Object.keys(metadata).length > 0) {
        msg += JSON.stringify(metadata);
    }
    return msg;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json() // CloudWatch loves JSON
    ),
    transports: [
        new winston.transports.Console({
            // Use pretty print for local dev if NOT in production
            format: process.env.NODE_ENV === 'production' 
                ? combine(timestamp(), json())
                : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), localFormat)
        })
    ],
});

export default logger;
