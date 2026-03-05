const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/psa-auth';
const JWT_SECRET = process.env.JWT_SECRET || '0105bf7d43ef45e096d828941ec733ab928399d614a493cd5c7ce3f505c1e9e6';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};



module.exports = {
    PORT,
    MONGO_URI,
    JWT_SECRET,
    connectDB
};
