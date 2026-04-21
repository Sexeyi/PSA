const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus
} = require('../controller/userController');
const auth = require('../middleware/auth');

// Ensure upload directory exists
const uploadDir = 'uploads/profile-pictures';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `user-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// All routes are protected
router.use(auth);

// User management routes
router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

router.patch('/:id/status', updateUserStatus);

// Profile picture routes
router.put('/:id/profile-picture', upload.single('profilePicture'), async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is updating their own profile picture or is superadmin
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized to update this user\'s profile picture' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Delete old profile picture if exists
        if (user.profilePicture) {
            const oldPath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Update user with new profile picture path
        user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
        await user.save();

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            profilePicture: user.profilePicture
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id/profile-picture', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is updating their own profile picture or is superadmin
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized to update this user\'s profile picture' });
        }

        // Delete old profile picture if exists
        if (user.profilePicture) {
            const oldPath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        user.profilePicture = null;
        await user.save();

        res.json({
            success: true,
            message: 'Profile picture removed successfully'
        });
    } catch (error) {
        console.error('Error removing profile picture:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get profile picture
router.get('/:id/profile-picture', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.params.id);

        if (!user || !user.profilePicture) {
            return res.status(404).json({ message: 'Profile picture not found' });
        }

        const imagePath = path.join(__dirname, '..', user.profilePicture);
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ message: 'Image file not found' });
        }

        res.sendFile(imagePath);
    } catch (error) {
        console.error('Error getting profile picture:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;