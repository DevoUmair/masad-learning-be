import Progress from "../models/progress.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";

export const getAllEnrolledStudents = async (req, res) => {
    try {
        const instructorId = req.user._id;

        // Find all courses by this instructor
        const instructorCourses = await Course.find({ instructor: instructorId }).select("_id");
        const courseIds = instructorCourses.map(course => course._id);

        // Find progress records for these courses
        const progressRecords = await Progress.find({ course: { $in: courseIds } })
            .populate("student", "name email")
            .populate("course", "title")
            .sort({ updatedAt: -1 });

        // Filter for unique students and count their enrollments
        const studentStatsMap = new Map();
        progressRecords.forEach(record => {
            const studentId = record.student?._id.toString();
            if (studentId) {
                if (!studentStatsMap.has(studentId)) {
                    studentStatsMap.set(studentId, {
                        ...record.toObject(),
                        coursesEnrolled: 1
                    });
                } else {
                    const stats = studentStatsMap.get(studentId);
                    stats.coursesEnrolled += 1;
                    // Optionally keep the most recent updated record
                    if (new Date(record.updatedAt) > new Date(stats.updatedAt)) {
                        const count = stats.coursesEnrolled;
                        Object.assign(stats, record.toObject());
                        stats.coursesEnrolled = count;
                    }
                }
            }
        });

        const uniqueStudents = Array.from(studentStatsMap.values());

        res.status(200).json(uniqueStudents);
    } catch (error) {
        console.error("Error fetching enrolled students progress:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getStudentProfile = async (req, res) => {
    try {
        const { studentId } = req.params;
        console.log(studentId);
        const instructorId = req.user._id;

        const student = await User.findById(studentId).select("name email firstName lastName createdAt");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Find all courses taught by this instructor
        const instructorCourses = await Course.find({ instructor: instructorId }).select("_id title modules");
        const courseIds = instructorCourses.map(course => course._id);

        // Fetch progress records for this student in these courses
        const progressRecords = await Progress.find({
            student: studentId,
            course: { $in: courseIds }
        }).populate("course", "title modules");

        const coursesWithStats = progressRecords.map(record => {
            // Find the course details to count total lessons
            const courseDetails = instructorCourses.find(c => c._id.toString() === record.course._id.toString());
            let totalLessons = 0;
            courseDetails?.modules.forEach(module => {
                totalLessons += module.lessons.length;
            });

            return {
                id: record._id,
                title: record.course.title,
                progress: record.completionPercentage,
                purchaseDate: new Date(record.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }),
                lastAccessed: record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : "N/A",
                totalChapters: totalLessons,
                chaptersCompleted: record.completedLessons.length
            };
        });

        res.status(200).json({
            success: true,
            student: {
                id: student._id,
                name: student.name,
                email: student.email,
                joinedDate: new Date(student.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }),
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`,
                coursesEnrolled: coursesWithStats.length
            },
            courses: coursesWithStats
        });
    } catch (error) {
        console.error("Error fetching student profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getInstructorStats = async (req, res) => {
    try {
        const instructorId = req.user._id;

        const instructor = await User.findById(instructorId).select("instructorProfile");
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        const courses = await Course.find({ instructor: instructorId })
            .populate("category", "name")
            .sort({ updatedAt: -1 });

        const courseIds = courses.map(course => course._id);

        // Calculate unique students across all courses
        const uniqueStudents = await Progress.distinct("student", { course: { $in: courseIds } });

        const stats = {
            totalStudents: uniqueStudents.length,
            totalEarnings: instructor.instructorProfile.totalEarnings || 0,
            averageRating: instructor.instructorProfile.instructorRating || 0,
            courses: courses.map(course => ({
                id: course._id,
                title: course.title,
                category: course.category?.name || "Uncategorized",
                status: course.isApproved ? "Published" : "Pending", // Or some other logic for status
                enrollees: course.totalStudents || 0,
                revenue: course.price * course.totalStudents, // Simplified revenue calculation
                updatedAt: course.updatedAt
            }))
        };

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error("Error fetching instructor stats:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getInstructorProfileForAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const instructor = await User.findById(id).select("-password");
        if (!instructor || instructor.role !== 'instructor') {
            return res.status(404).json({ message: "Instructor not found" });
        }

        const courses = await Course.find({ instructor: id })
            .populate("category", "name")
            .sort({ updatedAt: -1 });

        const courseIds = courses.map(course => course._id);

        // Unique students across all courses
        const uniqueStudentsCount = (await Progress.distinct("student", { course: { $in: courseIds } })).length;

        // Total revenue using the simplified logic: sum of (price * totalStudents) for all courses
        const totalRevenue = courses.reduce((acc, course) => acc + (course.price * (course.totalStudents || 0)), 0);

        const instructorData = {
            id: instructor._id,
            name: instructor.name,
            email: instructor.email,
            avatar: instructor.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            role: "Instructor",
            status: "Active",
            joinDate: new Date(instructor.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            bio: instructor.instructorProfile?.bio || "No bio provided.",
            stats: {
                totalRevenue,
                pendingPayout: instructor.instructorProfile?.pendingPayout || 0,
                students: uniqueStudentsCount,
                courses: courses.length,
                rating: instructor.instructorProfile?.instructorRating || 0
            },
            pendingAmount: instructor.instructorProfile?.pendingPayout || 0,
            courses: courses.map(course => ({
                id: course._id,
                title: course.title,
                thumbnail: course.thumbnail || "/course-placeholder.jpg",
                students: course.totalStudents || 0,
                rating: course.averageRating || 0,
                price: `AED ${course.price}`,
                status: course.isApproved ? "Published" : "Pending",
                modules: course.lessons?.length || 0
            }))
        };

        res.status(200).json({
            success: true,
            instructorData
        });
    } catch (error) {
        console.error("Error fetching admin instructor profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};