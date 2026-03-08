import Course from "../models/course.model.js";
import Resource from "../models/resourceSchema.model.js";
import { cleanupLocalFiles } from "../utils/bunny.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_API_KEY = process.env.BUNNY_TOKEN_KEY;
export const createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            thumbnailImage,
            category,
            level,
            courseIncludes
        } = req.body;

        let whatYouWillLearn = [];
        try {
            whatYouWillLearn = typeof req.body.whatYouWillLearn === 'string' ? JSON.parse(req.body.whatYouWillLearn) : (req.body.whatYouWillLearn || []);
        } catch (e) {
            console.error("Failed to parse whatYouWillLearn:", e);
        }

        // Modules usually come as a JSON string when using FormData
        let modules = [];
        try {
            modules = typeof req.body.modules === 'string' ? JSON.parse(req.body.modules) : req.body.modules;
        } catch (e) {
            console.error("Failed to parse modules:", e);
        }

        // Validate required fields
        if (!title || !category || !req.user._id) {
            return res.status(400).json({ message: "Please provide all required fields including title, and category." });
        }


        let thumbnailResourceId = null;
        const thumbnailFile = req.files?.find(f => f.fieldname === 'thumbnailImage');
        if (thumbnailFile) {
            console.log(`Uploading thumbnail ${thumbnailFile.originalname} to Cloudinary...`);
            const uploadResult = await uploadToCloudinary(thumbnailFile.path, "course_thumbnails");
            if (uploadResult) {
                const resource = new Resource({
                    title: thumbnailFile.originalname,
                    url: uploadResult.url,
                    publicId: uploadResult.publicId
                });
                const savedResource = await resource.save();
                thumbnailResourceId = savedResource._id;
            }
        }

        // --- BUNNY.NET & CLOUDINARY (RESOURCES) UPLOADS ---
        let totalVideoSeconds = 0;
        let totalResources = 0;
        if (modules && modules.length > 0) {
            for (let m = 0; m < modules.length; m++) {
                const module = modules[m];
                let moduleDuration = 0;

                for (let l = 0; l < module.lessons.length; l++) {
                    const lesson = module.lessons[l];

                    lesson.resources = [];
                    lesson.lessonDuration = 0;

                    if (lesson.libraryVideo) {
                        // Use existing or newly uploaded video from library
                        lesson.videoId = lesson.libraryVideo.bunnyVideoId || lesson.libraryVideo.videoId;
                        lesson.libraryId = lesson.libraryVideo.bunnyLibraryId || lesson.libraryVideo.libraryId;
                        lesson.lessonDuration = lesson.libraryVideo.duration || Number(lesson.duration) || 0;
                    } else if (lesson.videoId) {
                        // Keep existing video data
                        lesson.lessonDuration = Number(lesson.lessonDuration) || Number(lesson.duration) || 0;
                    }

                    const resourceFiles = req.files?.filter(f => f.fieldname.startsWith(`resource_${m}_${l}_`)) || [];

                    for (let rFile of resourceFiles) {
                        console.log(`Uploading lesson resource ${rFile.originalname} to Cloudinary...`);
                        const uploadResult = await uploadToCloudinary(rFile.path, "lesson_resources");


                        const rIndex = rFile.fieldname.split('_').pop();
                        const customTitle = req.body[`resourceTitle_${m}_${l}_${rIndex}`] || rFile.originalname;

                        if (uploadResult) {
                            const resourceDoc = new Resource({
                                title: customTitle,
                                url: uploadResult.url,
                                publicId: uploadResult.publicId
                            });
                            const savedResourceDoc = await resourceDoc.save();

                            // Push the newly created Resource ObjectId into the lesson's resources array
                            lesson.resources.push(savedResourceDoc._id);
                        }
                    }

                    totalResources += (lesson.resources?.length || 0);
                    moduleDuration += lesson.lessonDuration || 0;
                }

                module.moduleDuration = parseFloat(moduleDuration.toFixed(2));
                totalVideoSeconds += module.moduleDuration;
            }
        }

        cleanupLocalFiles(req.files);


        const courseData = {
            title,
            description: description || "",
            thumbnailImage: thumbnailResourceId,
            instructor: req.user._id,
            category,
            level: level || "All Levels",
            courseIncludes: {
                totalVideoHours: courseIncludes.totalVideoHours ? courseIncludes.totalVideoHours : parseFloat((totalVideoSeconds / 3600).toFixed(2)), // Auto-calculated from lessons
                downloadableResources: courseIncludes.downloadableResources ? courseIncludes.downloadableResources : totalResources, // Auto-calculated
                fullLifetimeAccess: courseIncludes?.fullLifetimeAccess === 'false' ? false : true,
                certificateOfCompletion: courseIncludes?.certificateOfCompletion === 'false' ? false : true,
            },
            whatYouWillLearn: whatYouWillLearn,
            modules: modules || []
        };

        const course = new Course(courseData);
        const createdCourse = await course.save();

        res.status(201).json({
            success: true,
            message: "Course and videos uploaded successfully",
            course: createdCourse
        });

    } catch (error) {
        console.error("Error creating course:", error);
        cleanupLocalFiles(req.files);
        res.status(500).json({ success: false, message: "Server error creating course" });
    }
};

export const getCourses = async (req, res) => {
    try {
        let queryFilter = {};

        if (req.query.isApproved !== undefined) {
            queryFilter.isApproved = req.query.isApproved === 'true';
        }
        const courses = await Course.find(queryFilter)
            .populate("instructor", "name email instructorProfile")
            .populate("modules")
            .populate("modules.lessons")
            .populate("modules.lessons.resources")
            .populate("thumbnailImage")
            .populate("category");

        res.status(200).json({ success: true, courses, count: courses.length });
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ success: false, message: "Server error fetching courses" });
    }
};
export const getCourseById = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await Course.findById(id).populate("instructor", "name email instructorProfile").populate("modules").populate("modules.lessons").populate("modules.lessons.resources").populate("thumbnailImage").populate("category");
        res.status(200).json({ success: true, course });
    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({ success: false, message: "Server error fetching course" });
    }
};

export const getInstructorCourses = async (req, res) => {
    const { id } = req.params;
    try {
        const courses = await Course.find({ instructor: id }).populate("instructor", "name email instructorProfile").populate("modules").populate("modules.lessons").populate("modules.lessons.resources").populate("thumbnailImage").populate("category");
        res.status(200).json({ success: true, courses });
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ success: false, message: "Server error fetching courses" });
    }
};

export const approveCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        course.isApproved = true;
        course.price = price;
        await course.save();
        res.status(200).json({ success: true, message: "Course approved successfully" });
    } catch (error) {
        console.error("Error approving course:", error);
        res.status(500).json({ success: false, message: "Server error approving course" });
    }
};

export const editCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        console.log("======== FULL REQ.BODY ========", req.body);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const { title, description, category, level } = req.body;

        let whatYouWillLearn = [];
        try {
            whatYouWillLearn = typeof req.body.whatYouWillLearn === 'string' ? JSON.parse(req.body.whatYouWillLearn) : (req.body.whatYouWillLearn || []);
        } catch (e) {
            console.error("Failed to parse whatYouWillLearn:", e);
        }

        let modules = [];
        try {
            modules = typeof req.body.modules === 'string' ? JSON.parse(req.body.modules) : req.body.modules;
        } catch (e) {
            console.error("Failed to parse modules:", e);
        }

        // Handle thumbnail upload if a new one is provided
        let thumbnailResourceId = course.thumbnailImage;
        const thumbnailFile = req.files?.find(f => f.fieldname === 'thumbnailImage');
        if (thumbnailFile) {
            console.log(`Uploading new thumbnail ${thumbnailFile.originalname} to Cloudinary...`);
            const uploadResult = await uploadToCloudinary(thumbnailFile.path, "course_thumbnails");
            if (uploadResult) {
                const resource = new Resource({
                    title: thumbnailFile.originalname,
                    url: uploadResult.url,
                    publicId: uploadResult.publicId
                });
                const savedResource = await resource.save();
                thumbnailResourceId = savedResource._id;
            }
        }

        // Handle module/lesson file uploads (new videos & resources)
        let totalVideoSeconds = 0;
        let totalResources = 0;
        if (modules && modules.length > 0) {
            for (let m = 0; m < modules.length; m++) {
                const module = modules[m];
                let moduleDuration = 0;

                for (let l = 0; l < module.lessons.length; l++) {
                    const lesson = module.lessons[l];

                    // Only process resources if they don't already have ObjectIds
                    if (!lesson.resources) lesson.resources = [];

                    // Preserve existing resource ObjectIds (strings that look like Mongo IDs)
                    const existingResources = lesson.resources.filter(r => typeof r === 'string' && r.match(/^[0-9a-fA-F]{24}$/));
                    lesson.resources = existingResources;

                    if (lesson.libraryVideo) {
                        // Use existing or newly uploaded video from library
                        lesson.videoId = lesson.libraryVideo.bunnyVideoId || lesson.libraryVideo.videoId;
                        lesson.libraryId = lesson.libraryVideo.bunnyLibraryId || lesson.libraryVideo.libraryId;
                        lesson.lessonDuration = lesson.libraryVideo.duration || Number(lesson.duration) || 0;
                    } else if (lesson.videoId) {
                        // Keep existing video data
                        lesson.lessonDuration = Number(lesson.lessonDuration) || Number(lesson.duration) || 0;
                    }

                    // Resource uploads
                    const resourceFiles = req.files?.filter(f => f.fieldname.startsWith(`resource_${m}_${l}_`)) || [];
                    for (let rFile of resourceFiles) {
                        console.log(`Uploading lesson resource ${rFile.originalname} to Cloudinary...`);
                        const uploadResult = await uploadToCloudinary(rFile.path, "lesson_resources");
                        const rIndex = rFile.fieldname.split('_').pop();
                        const customTitle = req.body[`resourceTitle_${m}_${l}_${rIndex}`] || rFile.originalname;
                        if (uploadResult) {
                            const resourceDoc = new Resource({
                                title: customTitle,
                                url: uploadResult.url,
                                publicId: uploadResult.publicId
                            });
                            const savedResourceDoc = await resourceDoc.save();
                            lesson.resources.push(savedResourceDoc._id);
                        }
                    }

                    totalResources += (lesson.resources?.length || 0);
                    moduleDuration += lesson.lessonDuration || 0;
                }

                module.moduleDuration = parseFloat(moduleDuration.toFixed(2));
                totalVideoSeconds += module.moduleDuration;
            }
        }

        cleanupLocalFiles(req.files);

        const { courseIncludes } = req.body;
        // Update course fields
        course.title = title || course.title;
        course.description = description || course.description;
        course.thumbnailImage = thumbnailResourceId;
        course.category = category || course.category;
        course.level = level || course.level;
        course.courseIncludes = {
            totalVideoHours: courseIncludes?.totalVideoHours !== undefined
                ? parseFloat(courseIncludes.totalVideoHours)
                : parseFloat((totalVideoSeconds / 3600).toFixed(2)),

            downloadableResources: courseIncludes?.downloadableResources !== undefined
                ? parseInt(courseIncludes.downloadableResources, 10)
                : totalResources,

            // Convert the string 'false' to a boolean false, default to true otherwise
            fullLifetimeAccess: String(courseIncludes?.fullLifetimeAccess) === 'false' ? false : true,
            certificateOfCompletion: String(courseIncludes?.certificateOfCompletion) === 'false' ? false : true,
        };
        course.whatYouWillLearn = whatYouWillLearn;
        course.modules = modules || course.modules;

        const updatedCourse = await course.save();

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course: updatedCourse
        });

    } catch (error) {
        console.error("Error updating course:", error);
        cleanupLocalFiles(req.files);
        res.status(500).json({ success: false, message: "Server error updating course" });
    }
};


export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id)
            .populate("thumbnailImage")
            .populate("modules.lessons.resources");

        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        // 1. Collect all resources to delete from Cloudinary
        const cloudinaryPublicIds = [];
        const resourceDocIds = [];

        // Thumbnail
        if (course.thumbnailImage && course.thumbnailImage.publicId) {
            cloudinaryPublicIds.push({ id: course.thumbnailImage.publicId, type: "image" });
            resourceDocIds.push(course.thumbnailImage._id);
        }

        // Module/Lesson Resources
        course.modules?.forEach(module => {
            module.lessons?.forEach(lesson => {
                lesson.resources?.forEach(resource => {
                    if (resource.publicId) {
                        cloudinaryPublicIds.push({ id: resource.publicId, type: "raw" }); // Resources are usually 'raw'
                        resourceDocIds.push(resource._id);
                    }
                });
            });
        });

        // 2. Delete from Cloudinary
        for (const { id, type } of cloudinaryPublicIds) {
            console.log(`Deleting ${type} resource ${id} from Cloudinary...`);
            await deleteFromCloudinary(id, type);
        }

        // 3. Collect and delete videos from Bunny.net
        // const bunnyVideoIds = [];
        // course.modules?.forEach(module => {
        //     module.lessons?.forEach(lesson => {
        //         if (lesson.videoId) {
        //             bunnyVideoIds.push(lesson.videoId);
        //         }
        //     });
        // });

        // for (const videoId of bunnyVideoIds) {
        //     try {
        //         console.log(`Deleting video ${videoId} from Bunny.net...`);
        //         await axios.delete(
        //             `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
        //             {
        //                 headers: {
        //                     AccessKey: BUNNY_API_KEY,
        //                 },
        //             }
        //         );
        //     } catch (bunnyErr) {
        //         console.error(`Failed to delete video ${videoId} from Bunny.net:`, bunnyErr.response?.data || bunnyErr.message);
        //         // Continue with other deletions even if one fails
        //     }
        // }

        // 4. Delete Resource documents from DB
        if (resourceDocIds.length > 0) {
            await Resource.deleteMany({ _id: { $in: resourceDocIds } });
        }

        // 5. Finally delete the Course from DB
        await Course.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Course and all associated resources/videos deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ success: false, message: "Server error deleting course" });
    }
};
