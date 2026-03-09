import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { getAdminStats, createStripePromo } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/dashboard-stats', isAuthenticated, getAdminStats);
router.post("/create-promo", isAuthenticated, createStripePromo);

export default router;
