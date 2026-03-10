import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { createStripePromo, getPromos, togglePromoStatus } from '../controllers/promo.controller.js';

const router = express.Router();

router.post("/", isAuthenticated, createStripePromo);
router.get("/", isAuthenticated, getPromos);
router.patch("/toggle/:id", isAuthenticated, togglePromoStatus);

export default router;
