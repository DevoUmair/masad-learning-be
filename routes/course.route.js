import express from "express";
import { createCourse, getCourses } from "../controllers/course.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();
// Multer config for temporary local file storage before BunnyCDN upload
const upload = multer({ dest: 'uploads/' });

// Route to create a new course
router.post("/", isAuthenticated, upload.any(), createCourse);
router.get("/", getCourses);
export default router;
