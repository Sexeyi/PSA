const express = require('express');
const cors = require('cors');
require('dotenv').config();
const User = require('./models/User');
const mongoose = require('mongoose');

const { connectDB, PORT } = require('./config/db');
const authRoutes = require('./routes/auth');
const inventoryRoutes = require("./routes/inventoryRoutes");
const requisitionRoutes = require("./routes/requisitionRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// 1️⃣ Apply CORS and JSON parsing BEFORE routes
app.use(cors({
    origin: 'http://localhost:5173', // your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
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
app.use("/api/users", userRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        mongoDB: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Debug endpoint to check users (remove in production)
if (process.env.NODE_ENV === 'development') {
    app.get('/api/debug/users', async (req, res) => {
        try {
            const users = await User.find({}).select('-password');
            res.json({
                count: users.length,
                users: users.map(u => ({
                    id: u._id,
                    email: u.email,
                    role: u.role,
                    status: u.status,
                    fullName: u.fullName,
                    department: u.department
                }))
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Seed SuperAdmin - FIXED: Let the model's pre-save hook handle password hashing
const seedSuperAdmin = async () => {
    try {
        // Check if any superadmin exists
        const adminExist = await User.findOne({ role: "superadmin" });

        if (!adminExist) {
            console.log('📝 Creating SuperAdmin...');

            // Check if environment variables exist
            if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD) {
                console.log('⚠️ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env file');
                console.log('📝 Using default credentials for development');

                // Use default credentials for development
                const defaultEmail = 'superadmin@psa.gov.ph';
                const defaultPassword = 'SuperAdmin123!';

                // Create user WITHOUT hashing - let the model handle it
                await User.create({
                    fullName: "System Super Administrator",
                    employeeId: "SUPER001",
                    email: defaultEmail,
                    department: "Statistical Unit", // Make sure this matches your enum
                    password: defaultPassword, // Will be hashed by pre-save middleware
                    role: "superadmin",
                    status: "active"
                });

                console.log(`✅ Super Admin Created with:`);
                console.log(`   Email: ${defaultEmail}`);
                console.log(`   Password: ${defaultPassword}`);
                console.log(`   Role: superadmin`);

            } else {
                // Create user with env credentials - WITHOUT hashing
                await User.create({
                    fullName: "System Super Administrator",
                    employeeId: "SUPER001",
                    email: process.env.SUPER_ADMIN_EMAIL,
                    department: "Statistical Unit", // Make sure this matches your enum
                    password: process.env.SUPER_ADMIN_PASSWORD, // Will be hashed by pre-save middleware
                    role: "superadmin",
                    status: "active"
                });

                console.log(`✅ Super Admin Created with:`);
                console.log(`   Email: ${process.env.SUPER_ADMIN_EMAIL}`);
                console.log(`   Password: ${process.env.SUPER_ADMIN_PASSWORD}`);
                console.log(`   Role: superadmin`);
            }

            // Verify the created admin works
            const createdAdmin = await User.findOne({ role: "superadmin" });
            console.log(`🔐 Password hash created: ${!!createdAdmin.password}`);

        } else {
            console.log(`✅ Super Admin already exists: ${adminExist.email}`);

            // Optional: Verify the existing admin's password works with .env
            if (process.env.SUPER_ADMIN_PASSWORD && process.env.NODE_ENV === 'development') {
                const isMatch = await adminExist.comparePassword(process.env.SUPER_ADMIN_PASSWORD);
                console.log(`🔐 Existing admin password verification: ${isMatch ? '✅ Works!' : '❌ Failed!'}`);

                if (!isMatch) {
                    console.log('⚠️ Warning: Existing superadmin password does not match .env file');
                    console.log('   You may need to update the password or use the current one');
                }
            }
        }
    } catch (error) {
        console.error('❌ Error seeding SuperAdmin:', error);
        console.error('Error details:', error.message);
        if (error.code === 11000) {
            console.error('Duplicate key error. This might mean a user already exists with the same employeeId or email.');
        }
    }
};

// Start server
const startServer = async () => {
    try {
        await connectDB();

        // Log database collections for debugging
        if (process.env.NODE_ENV === 'development') {
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('📚 Database collections:', collections.map(c => c.name));
        }

        await seedSuperAdmin();

        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📊 MongoDB connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Frontend URL: http://localhost:5173`);
            console.log(`\n✅ Ready to accept requests`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();