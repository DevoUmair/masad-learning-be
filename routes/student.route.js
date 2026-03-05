import express from 'express';
import { enrollCourse, getEnrolledCourses, updateProgress, getCourseProgress } from '../controllers/student.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/enroll-course/:courseId', isAuthenticated, enrollCourse);
router.get('/enrolled-courses', isAuthenticated, getEnrolledCourses);
router.post('/update-progress/:courseId', isAuthenticated, updateProgress);
router.get('/course-progress/:courseId', isAuthenticated, getCourseProgress);

export default router;
