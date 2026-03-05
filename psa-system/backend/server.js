const express = require('express');
const cors = require('cors');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcrypt')


const { connectDB, PORT } = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        mongoDB: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const seedSuperAdmin = async () => {
    const adminExist = await User.findOne({ role: "SuperAdmin" })

    if (!adminExist) {
        const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);

        await User.create({
            fullName: "System SuperAdmin",
            employeeId: "SUPER001",
            email: process.env.SUPER_ADMIN_EMAIL,
            department: "Finance and Admin Unit",
            password: process.env.SUPER_ADMIN_PASSWORD,
            role: "SuperAdmin"
        });
        console.log("Super Admin Created!")
    }
}


// Import mongoose for connection checking
const mongoose = require('mongoose');

// Start server after connecting to     
const startServer = async () => {
    try {
        await connectDB();

        await seedSuperAdmin()

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`MongoDB connection state: ${mongoose.connection.readyState}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};



startServer();