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
        enum: ['SuperAdmin', 'Admin', 'Approver', 'Employee'],
        default: 'Employee'
    },
    password: {
        type: String,
        required: true
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


userSchema.pre('save', async function (next) {
    try {
        // Enforce single SuperAdmin
        if (this.role === 'SuperAdmin') {
            const existingSuperAdmin = await this.constructor.findOne({ role: 'SuperAdmin' });
            if (existingSuperAdmin && existingSuperAdmin._id.toString() !== this._id.toString()) {
                return next(new Error('There can only be one SuperAdmin'));
            }
        }

        // Hash password only if modified
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }

        // Update timestamp
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

const User = mongoose.model('User', userSchema);
module.exports = User;