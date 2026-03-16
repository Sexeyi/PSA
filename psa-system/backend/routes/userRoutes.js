const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus
} = require('../controller/userController');
const auth = require('../middleware/auth');

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

module.exports = router;