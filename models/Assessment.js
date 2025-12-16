const mongoose = require("mongoose")

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    skillCategory: {
      type: String,
      enum: ["basic", "intermediate", "advanced"],
      default: "basic",
    },
    questions: [
      {
        id: String,
        question: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
      },
    ],
    totalPoints: {
      type: Number,
      default: 100,
    },
    timeLimit: Number, // in minutes
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Assessment", assessmentSchema)
