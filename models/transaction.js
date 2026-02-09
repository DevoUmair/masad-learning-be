import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },

  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "USD"
  },

  paymentId: {
    type: String, // Stripe  transaction ID
  },

  status: {
    type: String,
    enum: ["paid", "failed", "refunded", "pending"],
    default: "paid"
  },

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Transaction", TransactionSchema);
