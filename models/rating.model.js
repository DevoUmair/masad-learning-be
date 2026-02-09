import mongoose from "mongoose";

const RatingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment: {
        type: String,
        trim: true
    },
}, { timestamps: true });

RatingSchema.index({ course: 1, user: 1 }, { unique: true });

export default mongoose.model('Rating', RatingSchema);
