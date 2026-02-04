const mongoose = require('mongoose');

const SocialSchema = new mongoose.Schema({
    website: String,
    twitter: String,
    linkedin: String,
    youtube: String
}, { _id: false });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['student', 'instructor', 'admin'],
        default: 'student'
    },

    instructorProfile: {
        headline: { type: String }, // e.g., "Senior Python Developer at Google"
        biography: { type: String }, // Full detailed text about their history
        socials: SocialSchema,       // Nested links

        // Social Proof (Cached)
        // You update these periodically based on their course performance
        totalStudents: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },

        // Verification
        isVerified: { type: Boolean, default: false } // "Blue Checkmark"
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