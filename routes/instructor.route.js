import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { getAllEnrolledStudents, getStudentProfile, getInstructorStats, getInstructorProfileForAdmin } from '../controllers/instructor.controller.js';

const router = express.Router();

router.get('/enrolled-students', isAuthenticated, getAllEnrolledStudents);
router.get('/student-profile/:studentId', isAuthenticated, getStudentProfile);
router.get('/dashboard-stats', isAuthenticated, getInstructorStats);
router.get('/admin/instructor-profile/:id', isAuthenticated, getInstructorProfileForAdmin);

export default router;
