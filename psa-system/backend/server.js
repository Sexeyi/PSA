const express = require('express');
const cors = require('cors');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs'); // Changed from 'bcrypt' to 'bcryptjs' for consistency
const mongoose = require('mongoose');

const { connectDB, PORT } = require('./config/db');
const authRoutes = require('./routes/auth');
const inventoryRoutes = require("./routes/inventoryRoutes");
const requisitionRoutes = require("./routes/requisitionRoutes");
const userRoutes = require("./routes/userRoutes"); // Add this if you have user management routes

const app = express();

// 1️⃣ Apply CORS and JSON parsing BEFORE routes
app.use(cors({
    origin: 'http://localhost:5173', // your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true // if you use cookies/auth
}));
app.use(express.json());

// 2️⃣ Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 3️⃣ Routes
app.use("/api/inventories", inventoryRoutes);
app.use("/api/requisitions", requisitionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // Add user routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        mongoDB: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Seed SuperAdmin (using lowercase role)
const seedSuperAdmin = async () => {
    try {
        const adminExist = await User.findOne({ role: "superadmin" });
        if (!adminExist) {
            // Check if environment variables exist
            if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD) {
                console.log('⚠️ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env file');
                return;
            }

            const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);
            await User.create({
                fullName: "System SuperAdmin",
                employeeId: "SUPER001",
                email: process.env.SUPER_ADMIN_EMAIL,
                department: "Finance and Admin Unit",
                password: hashedPassword, // Use hashed password, not plain text
                role: "superadmin", // lowercase
                status: "active"
            });
            console.log("✅ Super Admin Created with role: superadmin");
        } else {
            console.log("✅ Super Admin already exists");
        }
    } catch (error) {
        console.error('❌ Error seeding SuperAdmin:', error);
    }
};

// Start server
const startServer = async () => {
    try {
        await connectDB();
        await seedSuperAdmin();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 MongoDB connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();