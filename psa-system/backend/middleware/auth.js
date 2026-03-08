const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user; // full user object
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;