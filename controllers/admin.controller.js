import Transaction from "../models/transaction.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";

export const getAdminStats = async (req, res) => {
    try {
        // 1. Basic Stats
        const totalRevenueResult = await Transaction.aggregate([
            { $match: { status: "paid" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        const activeCourses = await Course.countDocuments({ isApproved: true });
        const totalInstructors = await User.countDocuments({ role: "instructor" });
        const totalStudents = await User.countDocuments({ role: "student" });

        // 2. Revenue Overview (Last 12 Months)
        const last12Months = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            last12Months.push({
                name: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear(),
                month: date.getMonth()
            });
        }

        const revenueOverview = await Promise.all(last12Months.map(async (m) => {
            const startOfMonth = new Date(m.year, m.month, 1);
            const endOfMonth = new Date(m.year, m.month + 1, 0, 23, 59, 59);

            const monthlyRevenue = await Transaction.aggregate([
                {
                    $match: {
                        status: "paid",
                        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            return {
                name: m.name,
                revenue: monthlyRevenue[0]?.total || 0
            };
        }));

        // 3. Recent Activity
        const recentTransactions = await Transaction.find({ status: "paid" })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("student", "name")
            .populate("course", "title");

        const recentCourses = await Course.find({ isApproved: false })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("instructor", "name");

        const recentActivities = [
            ...recentTransactions.map(t => ({
                id: `trans-${t._id}`,
                type: 'enrollment',
                user: t.student?.name || "Unknown Student",
                course: t.course?.title || "Unknown Course",
                amount: `AED ${t.amount}`,
                time: t.createdAt,
                status: 'Processed'
            })),
            ...recentCourses.map(c => ({
                id: `course-${c._id}`,
                type: 'new_course',
                user: c.instructor?.name || "Unknown Instructor",
                course: c.title,
                time: c.createdAt,
                status: 'Pending Review'
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        // Helper to format time relative to now for the frontend
        const formatRelativeTime = (date) => {
            const now = new Date();
            const diffMs = now - new Date(date);
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 60) return `${diffMins} minutes ago`;
            if (diffHours < 24) return `${diffHours} hours ago`;
            return `${diffDays} days ago`;
        };

        const formattedActivities = recentActivities.map(a => ({
            ...a,
            time: formatRelativeTime(a.time)
        }));

        res.status(200).json({
            success: true,
            stats: [
                { title: "Total Revenue", value: `AED ${totalRevenue.toLocaleString()}`, trend: "up", trendValue: "12%" }, // Trend calculation could be more precise
                { title: "Active Courses", value: activeCourses.toString(), trend: "up", trendValue: "4" },
                { title: "Total Instructors", value: totalInstructors.toString(), trend: "up", trendValue: "2" },
                { title: "Total Students", value: totalStudents.toLocaleString(), trend: "up", trendValue: "85" },
            ],
            revenueOverview,
            recentActivities: formattedActivities
        });

    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
