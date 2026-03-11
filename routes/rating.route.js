import express from 'express';
import { addOrUpdateRating, getCourseRatings, getUserCourseRating } from '../controllers/rating.controller.js';
// import { isAuthenticated } from '../middlewares/auth.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route to view course ratings
router.get('/:courseId', getCourseRatings);

// Protected routes (require login)
router.post('/:courseId', isAuthenticated, addOrUpdateRating);
router.get('/user/:courseId', isAuthenticated, getUserCourseRating);

export default router;
