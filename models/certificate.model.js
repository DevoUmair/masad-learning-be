import mongoose from "mongoose";
const CertificateSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    issueDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    // downloadUrl: String
}, { timestamps: true });

export default mongoose.model('Certificate', CertificateSchema);
