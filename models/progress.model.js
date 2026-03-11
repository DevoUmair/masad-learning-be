import mongoose from 'mongoose';

const ProgressSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons: [{
        lessonId: mongoose.Schema.Types.ObjectId,
        completedAt: { type: Date, default: Date.now }
    }],
    completionPercentage: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    finishDate: Date
}, { timestamps: true });

export default mongoose.model('Progress', ProgressSchema);