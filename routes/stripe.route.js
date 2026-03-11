import express from "express";
import { createCheckoutSession, stripeWebhook } from "../controllers/stripe.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create-checkout-session", isAuthenticated, createCheckoutSession);
router.post("/webhook", stripeWebhook);

export default router;