import mongoose from "mongoose";

const PromoSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true, // e.g., "SAVE20"
            trim: true
        },
        discountType: {
            type: String,
            enum: ["percentage"],
            required: true
        },
        discountValue: {
            type: Number,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        expiryDate: {
            type: Date,
            required: true
        },

    },
    { timestamps: true }
);

export default mongoose.model("Promo", PromoSchema);