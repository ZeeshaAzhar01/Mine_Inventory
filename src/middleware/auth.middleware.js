const jwt = require('jsonwebtoken');

// 1. Middleware to verify if the user is logged in
const verifyToken = (req, res, next) => {
    try {
        // Tokens are sent in the headers as "Authorization: Bearer <token>"
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // 401: We don't know who you are (No token)
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        // Extract the actual token string
        const token = authHeader.split(' ')[1];

        // Verify the token mathematically using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded payload (userId, role) to the request object
        req.user = decoded;

        // Move to the next step (Controller or next middleware)
        next();
    } catch (error) {
        // 401: The token is fake or expired
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

// 2. Middleware to check if the user is an Admin
const isAdmin = (req, res, next) => {
    // We already attached req.user in the verifyToken middleware above!
    if (!req.user || req.user.role !== 'ADMIN') {
        // 403: We know who you are, but you aren't allowed in here
        return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }
    
    // If they are an Admin, let them through
    next();
};

module.exports = {
    verifyToken,
    isAdmin
};