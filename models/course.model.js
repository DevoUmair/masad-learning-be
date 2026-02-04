const mongoose = require('mongoose');

const DownloadableResourceSchema = new mongoose.Schema({
    title: { type: String, required: true }, // e.g., "Source Code.zip"
    url: { type: String, required: true },   // S3 or Cloudinary URL
    type: {
        type: String,
        enum: ['pdf', 'zip', 'image', 'other'],
        default: 'other'
    }
});
const LessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    content: String, // Text content
    fermionVideoId: { type: String }, // The ID used to fetch the secure Fermion URL
    lesson_duration: Number, // in minutes
    resources: [DownloadableResourceSchema]
});

const ModuleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    module_duration: Number,
    lessons: [LessonSchema]
});

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    thumbnailImage: String,
    price: { type: mongoose.Schema.Types.ObjectId, ref: 'Pricing', required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    modules: [ModuleSchema],
    ratings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rating' }],
    category: String,
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
        default: 'All Levels'
    },
    courseIncludes: {
        totalVideoHours: { type: Number, default: 0 }, // e.g., 24 (Derived or Manual)
        downloadableResources: { type: Number, default: 0 }, // e.g., 12
        hasLifetimeAccess: { type: Boolean, default: true },
        hasCertificate: { type: Boolean, default: true },
    },
    learningOutcomes: [{ type: String }],
    isPublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);