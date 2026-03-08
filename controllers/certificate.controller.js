import Certificate from "../models/certificate.model.js";

export const getCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find({ student: req.user._id })
            .populate({
                path: "course",
                select: "title instructor",
                populate: [
                    {
                        path: "instructor",
                        select: "name email"
                    },
                    {
                        path: "thumbnailImage",
                        select: "url"
                    }
                ]
            })
            .populate("student", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, certificates });
    } catch (error) {
        console.error("Error fetching certificates:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getCertificateById = async (req, res) => {
    const { id } = req.params;
    console.log("-==========", id);
    try {
        const certificate = await Certificate.findById(id)
            .populate({
                path: "course",
                select: "title description ",
                populate: [
                    {
                        path: "instructor",
                        select: "name email"
                    },
                    {
                        path: "thumbnailImage",
                        select: "url"  // Only URL needed for display
                    }
                ]
            })
            .populate("student", "name email")
            .lean(); // Use lean for better performance

        if (!certificate) {
            return res.status(404).json({ success: false, message: "Certificate not found" });
        }

        res.status(200).json({ success: true, certificate });
    } catch (error) {
        console.error("Error fetching certificate by ID:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
