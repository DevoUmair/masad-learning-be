import Rating from '../models/rating.model.js';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';

// Add or update a rating for a course
export const addOrUpdateRating = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id;

        // 1. Verify user is enrolled in the course
        const user = await User.findById(userId);
        const isEnrolled = user.enrolledCourses.some(id => id.toString() === courseId);

        if (!isEnrolled) {
            return res.status(403).json({ success: false, message: "You must be enrolled in this course to leave a review." });
        }

        // 2. Validate rating value
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
        }

        // 3. Upsert the rating
        const savedRating = await Rating.findOneAndUpdate(
            { course: courseId, user: userId },
            { rating, comment },
            { new: true, upsert: true, runValidators: true }
        );

        // 4. Recalculate Course Average Rating
        const stats = await Rating.aggregate([
            { $match: { course: savedRating.course } },
            {
                $group: {
                    _id: '$course',
                    averageRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        // 5. Update Course model with new stats
        let courseInstructorId = null;
        if (stats.length > 0) {
            const updatedCourse = await Course.findByIdAndUpdate(courseId, {
                averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place
                totalRatings: stats[0].totalRatings
            }, { new: true });

            courseInstructorId = updatedCourse?.instructor;
        }

        // 6. Recalculate Instructor's Global Average Rating
        if (courseInstructorId) {
            const instructorStats = await Course.aggregate([
                { $match: { instructor: courseInstructorId, totalRatings: { $gt: 0 } } },
                {
                    $group: {
                        _id: '$instructor',
                        globalAverage: { $avg: '$averageRating' },
                        globalTotalReviews: { $sum: '$totalRatings' }
                    }
                }
            ]);

            if (instructorStats.length > 0) {
                await User.findByIdAndUpdate(courseInstructorId, {
                    'instructorProfile.averageRating': Math.round(instructorStats[0].globalAverage * 10) / 10,
                    'instructorProfile.totalReviews': instructorStats[0].globalTotalReviews
                });
            } else {
                await User.findByIdAndUpdate(courseInstructorId, {
                    'instructorProfile.averageRating': 0,
                    'instructorProfile.totalReviews': 0
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Rating saved successfully.",
            rating: savedRating
        });

    } catch (error) {
        console.error("Error saving rating:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get all ratings for a specific course
export const getCourseRatings = async (req, res) => {
    try {
        const { courseId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const ratings = await Rating.find({ course: courseId })
            .populate('user', 'firstName lastName name profilePicture') // Get user details
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Rating.countDocuments({ course: courseId });

        res.status(200).json({
            success: true,
            ratings,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching ratings:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Check if a specific user has rated a course (and return it)
export const getUserCourseRating = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        const rating = await Rating.findOne({ course: courseId, user: userId });

        res.status(200).json({
            success: true,
            rating: rating || null // Return null if not rated yet
        });

    } catch (error) {
        console.error("Error fetching user rating:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
