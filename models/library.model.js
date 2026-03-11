import mongoose from "mongoose";

const librarySchema = new mongoose.Schema({
    title: { type: String, required: true, index: true },

    bunnyVideoId: { type: String, required: true, unique: true }, // From the TUS upload

    bunnyLibraryId: { type: String, required: true },

    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    duration: { type: Number, default: 0 },

    status: { type: String, enum: ['uploading', 'processing', 'ready', 'failed'], default: 'uploading' },

    tags: [{ type: String, index: true }]
}, { timestamps: true });

export default mongoose.model('Library', librarySchema);