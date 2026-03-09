import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Progress from "../models/progress.model.js";
import Certificate from "../models/certificate.model.js";
import { sendEnrollmentEmail } from "../utils/emailTemplates/enrollment.js";
import { sendCertificateEmail } from "../utils/emailTemplates/certificate.js";

export const enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent duplicate enrollment
        if (user.enrolledCourses.includes(courseId)) {
            return res.status(400).json({ message: "Already enrolled in this course" });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        if (course.price > 0) {
            return res.status(400).json({ message: "This course requires payment. Please use checkout." });
        }

        // Add course to student's enrolled courses
        user.enrolledCourses.push(courseId);
        await user.save();

        // Increment totalStudents on the course and add student to enrolledStudents
        course.totalStudents += 1;
        course.enrolledStudents.push(req.user._id);
        await course.save();

        // Increment totalStudents on the instructor's profile (nested inside instructorProfile)
        await User.findByIdAndUpdate(course.instructor, {
            $inc: { "instructorProfile.totalStudents": 1 }
        });

        // Initialize progress for this student and course
        const newProgress = new Progress({
            student: req.user._id,
            course: courseId
        });
        await newProgress.save();

        // Send Enrollment Email (non-blocking)
        sendEnrollmentEmail(req.user.email, req.user.name, course.title, course.price)
            .catch(err => console.error("Enrollment Email Error:", err));

        res.status(200).json({ success: true, message: "Course enrolled successfully" });
    } catch (error) {
        console.error("Error enrolling course:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getEnrolledCourses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const enrolledCourses = await Course.find({ _id: { $in: user.enrolledCourses } })
            .populate('instructor', 'name')
            .populate('category', 'name')
            .populate('thumbnailImage')
            .lean(); // .lean() allows appending new properties

        const progresses = await Progress.find({
            student: req.user._id,
            course: { $in: user.enrolledCourses }
        });

        const coursesWithProgress = enrolledCourses.map(course => {
            const progress = progresses.find(p => p.course.toString() === course._id.toString());
            return {
                ...course,
                progress: progress ? progress.completionPercentage : 0,
                completedLessons: progress ? progress.completedLessons : []
            };
        });

        res.status(200).json({ success: true, courses: coursesWithProgress });
    } catch (error) {
        console.error("Error fetching enrolled courses:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { lessonId } = req.body;

        if (!lessonId) {
            return res.status(400).json({ message: "Lesson ID is required" });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Calculate total number of lessons across all modules
        let totalLessons = 0;
        course.modules.forEach(module => {
            totalLessons += module.lessons.length;
        });

        if (totalLessons === 0) totalLessons = 1; // Prevent division by zero

        // Find or create progress document
        let progress = await Progress.findOne({ student: req.user._id, course: courseId });
        if (!progress) {
            progress = new Progress({ student: req.user._id, course: courseId });
        }

        // Check if lesson is already marked complete
        const alreadyCompleted = progress.completedLessons.some(
            l => l.lessonId && l.lessonId.toString() === lessonId
        );

        if (!alreadyCompleted) {
            progress.completedLessons.push({ lessonId, completedAt: Date.now() });

            // Recalculate percentage
            const newPercentage = Math.round((progress.completedLessons.length / totalLessons) * 100);
            progress.completionPercentage = newPercentage > 100 ? 100 : newPercentage;

            if (progress.completionPercentage === 100 && !progress.isCompleted) {
                progress.isCompleted = true;
                progress.finishDate = Date.now();

                // Create Certificate if it doesn't exist
                const existingCertificate = await Certificate.findOne({
                    student: req.user._id,
                    course: courseId
                });

                if (!existingCertificate) {
                    const certificate = new Certificate({
                        student: req.user._id,
                        course: courseId,
                        issueDate: Date.now()
                    });
                    await certificate.save();

                    // Send Certificate Email (non-blocking)
                    sendCertificateEmail(req.user.email, req.user.name, course.title)
                        .catch(err => console.error("Certificate Email Error:", err));
                }
            }

            await progress.save();
        }

        res.status(200).json({ success: true, progress });
    } catch (error) {
        console.error("Error updating progress:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const progress = await Progress.findOne({ student: req.user._id, course: courseId });

        if (!progress) {
            return res.status(404).json({ message: "Progress not found for this course" });
        }

        res.status(200).json({ success: true, progress });
    } catch (error) {
        console.error("Error fetching progress:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};