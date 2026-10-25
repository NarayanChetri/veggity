const jwt = require('jsonwebtoken');

// Middleware to protect routes that require user to be logged in
const ensureAuthenticated = (req, res, next) => {
    // 1. Grab token sent in HTTP headers (support both 'Authorization: <token>' and 'Authorization: Bearer <token>')
    const authHeader = req.headers['authorization'];

    // If no token was provided, reject immediately
    if (!authHeader) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Login token missing' });
    }

    try {
        // Strip 'Bearer ' prefix if present
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

        // 2. Verify token signature using JWT_SECRET from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Attach decoded user payload ({ _id, email }) to request
        req.user = decoded;

        // Pass control to the next handler/controller
        next();
    } catch (err) {
        // Token is invalid, expired, or forged
        return res.status(403).json({ success: false, message: 'Token is invalid or expired' });
    }
};

module.exports = ensureAuthenticated;
