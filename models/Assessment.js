const mongoose = require("mongoose");

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
    skillCategory: {
  type: String,
  enum: [
    'basic', 
    'intermediate', 
    'advanced',
    'iq',      // Add these
    'math',
    'science',
    'general',
    'computer'
  ],
  required: true
},

    timeLimit: Number, // in minutes
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isAiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assessment", assessmentSchema);
