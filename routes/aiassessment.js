// routes/aiAssessments.js
const express = require("express");
const router = express.Router();
const Assessment = require("../models/Assessment");
const authMiddleware = require("../middleware/auth");

// optional: only allow students to generate
const User = require("../models/User");

async function requireStudent(req, res, next) {
  try {
    // req.userId should be set by your auth middleware from the token
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await User.findById(req.userId).select("role");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User role:", user.role);

    if (user.role !== "student") {
      return res
        .status(403)
        .json({ error: "Only students can generate tests" });
    }

    // Optionally attach user to req for later use
    req.user = user;

    next();
  } catch (err) {
    console.error("requireStudent error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// helper to call your AI provider (pseudo‑code)
async function callAiProvider({ ageGroup, difficulty, questionCount }) {
  // Build a prompt asking for strict JSON in your target shape.
  // Here we just stub with fake questions.
  const questions = [];
  for (let i = 0; i < questionCount; i++) {
    const opts = ["Option A", "Option B", "Option C", "Option D"];
    questions.push({
      id: String(i + 1),
      question: `Sample question ${
        i + 1
      } for age ${ageGroup}, difficulty ${difficulty}?`,
      options: opts,
      correctAnswer: opts[0],
      explanation: "Sample explanation.",
    });
  }
  return questions;
}

router.post(
  "/ai-assessments/generate",
  authMiddleware,
  requireStudent,
  async (req, res) => {
    try {
      const { ageGroup, questionCount } = req.body;

      if (!ageGroup || !questionCount) {
        return res
          .status(400)
          .json({ error: "ageGroup and questionCount are required" });
      }

      const countNum = Number(questionCount);
      if (Number.isNaN(countNum) || countNum < 3 || countNum > 30) {
        return res
          .status(400)
          .json({ error: "questionCount must be between 3 and 30" });
      }

      // You can still infer difficulty purely for the AI prompt if you want:
      // const difficulty = deriveDifficultyFromAge(ageGroup); // optional

      const aiQuestions = await callAiProvider({
        ageGroup,
        questionCount: countNum,
        // difficulty,  // only used inside the AI call, not stored
      });

      const cleanedQuestions = aiQuestions.map((q, index) => ({
        id: q.id || String(index + 1),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
      }));

      const assessmentDoc = await Assessment.create({
        title: `AI assessment (${ageGroup})`,
        description: `Auto-generated digital skills assessment for age ${ageGroup}.`,
        // skillCategory must be "basic" | "intermediate" | "advanced"
        skillCategory: "basic", // or choose one based on your own logic
        totalPoints: cleanedQuestions.length,
        timeLimit: 20,
        questions: cleanedQuestions,
        isAiGenerated: true,
      });

      res.json({ assessment: assessmentDoc });
    } catch (err) {
      res
        .status(500)
        .json({ error: err.message || "Failed to generate AI assessment" });
    }
  }
);

module.exports = router;
