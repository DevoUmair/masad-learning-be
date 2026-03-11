import express from 'express';
import { register, login, logout, refreshAccessToken, getMe, getAllUsers } from '../controllers/user.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshAccessToken);
router.get('/me', isAuthenticated, getMe);
router.get('/', isAuthenticated, getAllUsers);

export default router;
