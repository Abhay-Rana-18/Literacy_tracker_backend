const mongoose = require("mongoose")

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentResult",
      required: true,
    },
    recommendations: [String],
    nextSteps: [String],
    suggestedModules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LearningModule",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Recommendation", recommendationSchema)
