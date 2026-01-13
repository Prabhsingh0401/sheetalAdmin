import logger from "../utils/logger.js";
import { config } from "../config/config.js";

const errorHandler = (err, req, res, next) => {

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // winston logging
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user ? req.user._id : "Guest"
    });

    // cast error
    if (err.name === "CastError") {
        message = `Resource not found. Invalid ID format at: ${err.path}`;
        statusCode = 400;
    }

    // mongoose duplicate key error (Email, SKU, etc.)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue);
        message = `${field} already exists. Please use another value.`;
        statusCode = 400;
    }

    // wrong JWT error
    if (err.name === "JsonWebTokenError") {
        message = "Json Web Token is invalid. Please login again!";
        statusCode = 401;
    }

    // JWT expire error
    if (err.name === "TokenExpiredError") {
        message = "Your session has expired. Please login again!";
        statusCode = 401;
    }

    // validation Error
    if (err.name === "ValidationError") {
        message = Object.values(err.errors).map((val) => val.message).join(", ");
        statusCode = 400;
    }

    // final response
    res.status(statusCode).json({ success: false, message: message, stack: config.mode === "development" ? err.stack : undefined });
};

export default errorHandler;