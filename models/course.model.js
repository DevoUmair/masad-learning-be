import mongoose from "mongoose";

const LessonSchema = new mongoose.Schema({
  videoTitle: { type: String, required: true },
  lessonTitle: String,
  lessonDescription: String,

  videoId: {
    type: String,
  },

  libraryId: {
    type: String
  },

  resources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource"
  }],

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

    thumbnailImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource"
    },

    price: { type: Number, default: 0 },
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

    promo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promo"
    },

    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },


    courseIncludes: {
      totalVideoHours: { type: Number, default: 0 },
      downloadableResources: { type: Number, default: 0 },
      fullLifetimeAccess: { type: Boolean, default: true },
      certificateOfCompletion: { type: Boolean, default: true },
    },

    whatYouWillLearn: {
      type: [String],
      default: []
    },

    isApproved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);
