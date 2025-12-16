const mongoose = require("mongoose")

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    score: Number,
    maxScore: Number,
    percentage: Number,
    answers: [
      {
        questionId: String,
        userAnswer: String,
        isCorrect: Boolean,
      },
    ],
    digitalLiteracyLevel: {
      type: String,
      enum: ["literate", "semi-literate", "illiterate"],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    feedback: String,
  },
  { timestamps: true },
)

module.exports = mongoose.model("AssessmentResult", resultSchema)
