import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    email: { type: String, required: true, unique: true },
    phone: String,

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
      required: true
    },

    instructorProfile: {
      totalStudents: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      areaOfExpertise: { type: String, default: null },
      bunnyCollectionId: { type: String, default: null },
      instructorRating: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      totalPaidOut: { type: Number, default: 0 }
    },

    refreshToken: String,
    enrolledCourses: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Course" }
    ],

  },
  { timestamps: true }
);

UserSchema.methods.clearSession = function () {
  this.refreshToken = null;
  return this.save();
};

export default mongoose.model("User", UserSchema);
