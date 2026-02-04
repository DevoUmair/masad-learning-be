const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: String, // Text content
    fermionVideoId: { type: String }, // The ID used to fetch the secure Fermion URL
    lesson_duration: Number, // in minutes
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
    isPublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);