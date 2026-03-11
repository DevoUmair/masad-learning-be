import express from "express";
import {
    getCertificates,
    getCertificateById
} from "../controllers/certificate.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", isAuthenticated, getCertificates);
router.get("/:id", isAuthenticated, getCertificateById);


export default router;
