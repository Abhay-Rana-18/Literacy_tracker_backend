const express = require("express");
const authMiddleware = require("../middleware/auth");
const Assessment = require("../models/Assessment");
const AssessmentResult = require("../models/AssessmentResult");
const User = require("../models/User");

const router = express.Router();

// Middleware to check if user is teacher or admin
const isTeacherOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role !== "teacher" && user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Teacher or admin role required." });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all assessments
router.get("/", async (req, res) => {
  try {
    const assessments = await Assessment.find();
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single assessment
router.get("/:id", async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new assessment (Teacher/Admin only)
router.post("/", authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      skillCategory,
      questions,
      totalPoints,
      timeLimit,
    } = req.body;

    // Validation
    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    if (!questions || questions.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one question is required" });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (
        !q.question ||
        !q.options ||
        q.options.length < 2 ||
        !q.correctAnswer
      ) {
        return res.status(400).json({
          error: `Question ${
            i + 1
          } is incomplete. Ensure it has a question text, at least 2 options, and a correct answer.`,
        });
      }
    }

    const assessment = new Assessment({
      title,
      description,
      skillCategory: skillCategory || "basic",
      questions,
      totalPoints: totalPoints || 100,
      timeLimit,
      createdBy: req.userId,
    });

    await assessment.save();

    res.status(201).json({
      message: "Assessment created successfully",
      assessment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update assessment (Teacher/Admin only)
router.put("/:id", authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      skillCategory,
      questions,
      totalPoints,
      timeLimit,
    } = req.body;
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    // Validation
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (
          !q.question ||
          !q.options ||
          q.options.length < 2 ||
          !q.correctAnswer
        ) {
          return res.status(400).json({
            error: `Question ${
              i + 1
            } is incomplete. Ensure it has a question text, at least 2 options, and a correct answer.`,
          });
        }
      }
    }

    // Update fields
    if (title) assessment.title = title;
    if (description) assessment.description = description;
    if (skillCategory) assessment.skillCategory = skillCategory;
    if (questions) assessment.questions = questions;
    if (totalPoints) assessment.totalPoints = totalPoints;
    if (timeLimit !== undefined) assessment.timeLimit = timeLimit;

    await assessment.save();

    res.json({
      message: "Assessment updated successfully",
      assessment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete assessment (Teacher/Admin only)
router.delete("/:id", authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    // Check if there are any results associated with this assessment
    const resultCount = await AssessmentResult.countDocuments({
      assessmentId: req.params.id,
    });

    if (resultCount > 0) {
      return res.status(400).json({
        error: `Cannot delete assessment. ${resultCount} student(s) have already taken this assessment.`,
        resultCount,
      });
    }

    await Assessment.findByIdAndDelete(req.params.id);

    res.json({
      message: "Assessment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicate assessment (Teacher/Admin only)
router.post(
  "/:id/duplicate",
  authMiddleware,
  isTeacherOrAdmin,
  async (req, res) => {
    try {
      const originalAssessment = await Assessment.findById(req.params.id);

      if (!originalAssessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      const duplicatedAssessment = new Assessment({
        title: `${originalAssessment.title} (Copy)`,
        description: originalAssessment.description,
        skillCategory: originalAssessment.skillCategory,
        questions: originalAssessment.questions,
        totalPoints: originalAssessment.totalPoints,
        timeLimit: originalAssessment.timeLimit,
        createdBy: req.userId,
      });

      await duplicatedAssessment.save();

      res.status(201).json({
        message: "Assessment duplicated successfully",
        assessment: duplicatedAssessment,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get assessment statistics (Teacher/Admin only)
router.get(
  "/:id/statistics",
  authMiddleware,
  isTeacherOrAdmin,
  async (req, res) => {
    try {
      const assessment = await Assessment.findById(req.params.id);

      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      const results = await AssessmentResult.find({
        assessmentId: req.params.id,
      }).populate("userId", "name email");

      const totalAttempts = results.length;
      const averageScore =
        totalAttempts > 0
          ? Math.round(
              results.reduce((acc, r) => acc + r.percentage, 0) / totalAttempts
            )
          : 0;

      const scoreDistribution = {
        literate: results.filter((r) => r.percentage >= 70).length,
        semiLiterate: results.filter(
          (r) => r.percentage >= 50 && r.percentage < 70
        ).length,
        illiterate: results.filter((r) => r.percentage < 50).length,
      };

      res.json({
        assessment: {
          id: assessment._id,
          title: assessment.title,
          totalQuestions: assessment.questions.length,
        },
        statistics: {
          totalAttempts,
          averageScore,
          scoreDistribution,
          highestScore:
            totalAttempts > 0
              ? Math.max(...results.map((r) => r.percentage))
              : 0,
          lowestScore:
            totalAttempts > 0
              ? Math.min(...results.map((r) => r.percentage))
              : 0,
        },
        recentResults: results.slice(-10).map((r) => ({
          studentName: r.userId.name,
          studentEmail: r.userId.email,
          score: r.percentage,
          completedAt: r.createdAt,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Submit assessment (Students)
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { assessmentId, answers } = req.body;
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    let score = 0;
    const processedAnswers = answers.map((answer) => {
      const question = assessment.questions.find(
        (q) => q.id === answer.questionId
      );
      const isCorrect =
        question && question.correctAnswer === answer.userAnswer;
      if (isCorrect)
        score += assessment.totalPoints / assessment.questions.length;
      return {
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
      };
    });

    const percentage = Math.round((score / assessment.totalPoints) * 100);
    let digitalLiteracyLevel = "illiterate";
    if (percentage >= 70) digitalLiteracyLevel = "literate";
    else if (percentage >= 50) digitalLiteracyLevel = "semi-literate";

    const result = new AssessmentResult({
      userId: req.userId,
      assessmentId,
      score,
      maxScore: assessment.totalPoints,
      percentage,
      answers: processedAnswers,
      digitalLiteracyLevel,
      feedback: `Great job! You scored ${percentage}% on this assessment.`,
    });

    await result.save();

    // Update user's digital literacy level
    await User.findByIdAndUpdate(req.userId, {
      digitalLiteracyLevel,
    });

    res.json({
      result: {
        id: result._id,
        score,
        percentage,
        digitalLiteracyLevel,
        feedback: result.feedback,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
