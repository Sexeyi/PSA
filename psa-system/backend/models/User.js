const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        enum: [
            'Finance and Admin Unit',
            'Statistical Unit',
            'Civil Registration Unit',
            'National ID unit'
        ]
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'employee'],
        default: 'employee',
        lowercase: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware
userSchema.pre('save', async function (next) {
    try {
        // Only hash password if it's modified
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }

        // Enforce single SuperAdmin
        if (this.role === 'superadmin') {
            const existingSuperAdmin = await this.constructor.findOne({ role: 'superadmin' });
            if (existingSuperAdmin && existingSuperAdmin._id.toString() !== this._id.toString()) {
                return next(new Error('There can only be one SuperAdmin in the system'));
            }
        }

        this.updatedAt = Date.now();
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Convert to JSON method to exclude password
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', userSchema);
module.exports = User;