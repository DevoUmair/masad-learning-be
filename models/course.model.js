import mongoose from "mongoose";

const LessonSchema = new mongoose.Schema({
  videoTitle: { type: String, required: true },

  videoId: {
    type: String,
    required: true
  },

  pdfUrl: String, 

  duration: Number 
});

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  duration: Number,
  lessons: [LessonSchema]
});

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    thumbnailImage: String,

    price: { type: Number, required: true },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    modules: [ModuleSchema],

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "All Levels"
    },

    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },

    courseIncludes: {
      totalVideoHours: { type: Number, default: 0 },
      downloadableResources: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
