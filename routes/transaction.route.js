import express from "express";
import { getTransactions } from "../controllers/transaction.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", isAuthenticated, getTransactions);

export default router;