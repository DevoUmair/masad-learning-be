import mongoose from "mongoose";

const PricingSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        unique: true // One active price policy per course
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'INR']
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Useful for flash sales
    saleEndDate: {
        type: Date
    }
}, { timestamps: true });



export default mongoose.model('Pricing', PricingSchema);