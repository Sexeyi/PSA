const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/db');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Register new user
const register = async (req, res) => {
    try {
        const { fullName, employeeId, email, department, role, password } = req.body;

        console.log('📝 Registration attempt:', { fullName, employeeId, email, department, role });

        // Validate required fields
        if (!fullName || !employeeId || !email || !department || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { employeeId }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Employee ID already registered'
            });
        }

        // Create new user
        const user = new User({
            fullName,
            employeeId,
            email,
            department,
            role: role || 'Requester',
            password
        });

        await user.save();

        // Generate token
        const token = generateToken(user);

        console.log('✅ User registered:', user.email);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                employeeId: user.employeeId,
                department: user.department,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                message: `${field} already exists`
            });
        }

        res.status(500).json({
            message: 'Server error during registration'
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login attempt:', email);

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user);

        console.log('✅ Login successful:', email, 'Role:', user.role);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                employeeId: user.employeeId,
                department: user.department,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('❌ Get current user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser
};