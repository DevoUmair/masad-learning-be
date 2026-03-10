import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { getAdminStats } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/dashboard-stats', isAuthenticated, getAdminStats);

export default router;
