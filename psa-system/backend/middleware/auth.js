const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/db');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;