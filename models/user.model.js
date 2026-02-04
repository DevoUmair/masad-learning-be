const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['student', 'instructor', 'admin'],
        default: 'student'
    },

    refreshToken: { type: String },
    isBlocked: { type: Boolean, default: false },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

}, { timestamps: true });

// Helper to clear session (Manual logout or force logout)
UserSchema.methods.clearSession = function () {
    this.refreshToken = null;
    return this.save();
};

module.exports = mongoose.model('User', UserSchema);