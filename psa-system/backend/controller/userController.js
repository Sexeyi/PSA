const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (SuperAdmin, Admin)
const getUsers = async (req, res) => {
    try {
        console.log('📋 Fetching all users...');

        const users = await User.find()
            .select('-password') // Exclude password field
            .sort({ createdAt: -1 }); // Sort by newest first

        console.log(`✅ Found ${users.length} users`);

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
    try {
        console.log('🔍 Fetching user by ID:', req.params.id);

        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            console.log('❌ User not found:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('✅ User found:', user.email);
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// @desc    Create new user (by SuperAdmin)
// @route   POST /api/users
// @access  Private (SuperAdmin only)
const createUser = async (req, res) => {
    try {
        const { fullName, employeeId, email, department, role, password } = req.body;

        console.log('📝 Creating new user:', { fullName, employeeId, email, department, role });

        // Validate required fields
        if (!fullName || !employeeId || !email || !department || !role || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { employeeId }]
        });

        if (existingUser) {
            console.log('❌ User already exists:', existingUser.email);
            return res.status(400).json({
                success: false,
                message: existingUser.email === email.toLowerCase()
                    ? 'Email already exists'
                    : 'Employee ID already exists'
            });
        }

        // Check SuperAdmin constraint
        if (role === 'superadmin') {
            const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
            if (existingSuperAdmin) {
                console.log('❌ SuperAdmin already exists');
                return res.status(400).json({
                    success: false,
                    message: 'There can only be one SuperAdmin in the system'
                });
            }
        }

        // Create new user
        const user = new User({
            fullName,
            employeeId,
            email: email.toLowerCase(),
            department,
            role: role.toLowerCase(),
            password,
            profilePicture: null
        });

        await user.save();
        console.log('✅ User created successfully:', user.email);

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });

    } catch (error) {
        console.error('❌ Error creating user:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (SuperAdmin only)
const updateUser = async (req, res) => {
    try {
        const { fullName, email, department, role, password } = req.body;

        console.log('📝 Updating user:', req.params.id);

        // Find user
        const user = await User.findById(req.params.id);
        if (!user) {
            console.log('❌ User not found:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is trying to modify SuperAdmin
        if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only SuperAdmin can modify SuperAdmin accounts'
            });
        }

        // Check SuperAdmin constraint if role is being changed to SuperAdmin
        if (role && role.toLowerCase() === 'superadmin' && user.role !== 'superadmin') {
            const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
            if (existingSuperAdmin && existingSuperAdmin._id.toString() !== user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'There can only be one SuperAdmin in the system'
                });
            }
        }

        // Check if email is being changed and if it's already taken
        if (email && email.toLowerCase() !== user.email) {
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Check if employeeId is being changed (should not happen as it's usually immutable)
        if (req.body.employeeId && req.body.employeeId !== user.employeeId) {
            const employeeIdExists = await User.findOne({ employeeId: req.body.employeeId });
            if (employeeIdExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID already exists'
                });
            }
            user.employeeId = req.body.employeeId;
        }

        // Update fields
        if (fullName) user.fullName = fullName;
        if (email) user.email = email.toLowerCase();
        if (department) user.department = department;
        if (role) user.role = role.toLowerCase();
        if (password) user.password = password; // Will be hashed by pre-save hook

        user.updatedAt = Date.now();
        await user.save();

        console.log('✅ User updated successfully:', user.email);

        // Return updated user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'User updated successfully',
            data: userResponse
        });

    } catch (error) {
        console.error('❌ Error updating user:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// @desc    Upload profile picture
// @route   PUT /api/users/:id/profile-picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('📸 Uploading profile picture for user:', userId);

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is updating their own profile picture or is superadmin
        if (req.user._id.toString() !== userId && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this user\'s profile picture'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Delete old profile picture if exists
        if (user.profilePicture) {
            const oldPath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
                console.log('🗑️ Deleted old profile picture');
            }
        }

        // Update user with new profile picture path
        user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
        await user.save();

        console.log('✅ Profile picture uploaded successfully');

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            profilePicture: user.profilePicture
        });
    } catch (error) {
        console.error('❌ Error uploading profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading profile picture',
            error: error.message
        });
    }
};

// @desc    Remove profile picture
// @route   DELETE /api/users/:id/profile-picture
// @access  Private
const removeProfilePicture = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('🗑️ Removing profile picture for user:', userId);

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is updating their own profile picture or is superadmin
        if (req.user._id.toString() !== userId && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this user\'s profile picture'
            });
        }

        // Delete old profile picture if exists
        if (user.profilePicture) {
            const oldPath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
                console.log('🗑️ Deleted profile picture');
            }
        }

        user.profilePicture = null;
        await user.save();

        console.log('✅ Profile picture removed successfully');

        res.json({
            success: true,
            message: 'Profile picture removed successfully'
        });
    } catch (error) {
        console.error('❌ Error removing profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing profile picture',
            error: error.message
        });
    }
};

// @desc    Get profile picture
// @route   GET /api/users/:id/profile-picture
// @access  Private
const getProfilePicture = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('📸 Getting profile picture for user:', userId);

        const user = await User.findById(userId);
        if (!user || !user.profilePicture) {
            return res.status(404).json({
                success: false,
                message: 'Profile picture not found'
            });
        }

        const imagePath = path.join(__dirname, '..', user.profilePicture);
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({
                success: false,
                message: 'Image file not found'
            });
        }

        res.sendFile(imagePath);
    } catch (error) {
        console.error('❌ Error getting profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting profile picture',
            error: error.message
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (SuperAdmin only)
const deleteUser = async (req, res) => {
    try {
        console.log('🗑️ Deleting user:', req.params.id);

        const user = await User.findById(req.params.id);

        if (!user) {
            console.log('❌ User not found:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deletion of SuperAdmin
        if (user.role === 'superadmin') {
            console.log('❌ Attempted to delete SuperAdmin');
            return res.status(400).json({
                success: false,
                message: 'SuperAdmin cannot be deleted'
            });
        }

        // Check if user is trying to delete themselves
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Delete profile picture if exists
        if (user.profilePicture) {
            const imagePath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('🗑️ Deleted profile picture');
            }
        }

        await User.findByIdAndDelete(req.params.id);

        console.log('✅ User deleted successfully');
        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// @desc    Update user status
// @route   PATCH /api/users/:id/status
// @access  Private (SuperAdmin, Admin)
const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;

        console.log('📝 Updating user status:', req.params.id, 'to:', status);

        // Validate status
        const validStatuses = ['active', 'inactive', 'suspended'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent status change of SuperAdmin by non-SuperAdmin
        if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only SuperAdmin can modify SuperAdmin status'
            });
        }

        user.status = status;
        user.updatedAt = Date.now();
        await user.save();

        console.log('✅ User status updated successfully');

        res.json({
            success: true,
            message: 'User status updated successfully',
            data: { status }
        });

    } catch (error) {
        console.error('❌ Error updating status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating status',
            error: error.message
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    uploadProfilePicture,
    removeProfilePicture,
    getProfilePicture
};