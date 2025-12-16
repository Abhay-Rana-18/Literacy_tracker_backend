const mongoose = require("mongoose")

const learningModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    skillLevel: {
      type: String,
      enum: ["basic", "intermediate", "advanced"],
      default: "basic",
    },
    lessons: [
      {
        id: String,
        title: String,
        content: String,
        videoUrl: String,
        resourceUrl: String,
      },
    ],
    duration: Number, // in minutes
    order: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("LearningModule", learningModuleSchema)
