const express = require("express");
const authMiddleware = require("../middleware/auth");
const AssessmentResult = require("../models/AssessmentResult");
const UserProgress = require("../models/UserProgress");
const User = require("../models/User");

const router = express.Router();

// Get student dashboard
router.get("/student", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const results = await AssessmentResult.find({ userId: req.userId });
    const progress = await UserProgress.find({ userId: req.userId }).populate(
      "moduleId"
    );

    const averageScore =
      results.length > 0
        ? Math.round(
            results.reduce((acc, r) => acc + r.percentage, 0) / results.length
          )
        : 0;

    res.json({
      user: {
        name: user.name,
        email: user.email,
        digitalLiteracyLevel: user.digitalLiteracyLevel,
      },
      stats: {
        assessmentsCompleted: results.length,
        averageScore,
        modulesInProgress: progress.filter((p) => p.completionPercentage < 100)
          .length,
        modulesCompleted: progress.filter((p) => p.completionPercentage === 100)
          .length,
      },
      recentResults: results.slice(-5),
      moduleProgress: progress,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get teacher dashboard
router.get("/teacher", authMiddleware, async (req, res) => {
  try {
    const allResults = await AssessmentResult.find().populate("userId");
    const allProgress = await UserProgress.find()
      .populate("userId")
      .populate("moduleId");

    const studentPerformance = {};
    allResults.forEach((result) => {
      // Skip if user is a teacher or userId is null
      if (!result.userId || result.userId.role === "teacher") {
        return;
      }

      if (!studentPerformance[result.userId._id]) {
        studentPerformance[result.userId._id] = {
          studentName: result.userId.name,
          assessmentCount: 0,
          averageScore: 0,
        };
      }
      studentPerformance[result.userId._id].assessmentCount += 1;
      studentPerformance[result.userId._id].averageScore += result.percentage;
    });

    Object.keys(studentPerformance).forEach((key) => {
      if (studentPerformance[key].assessmentCount > 0) {
        studentPerformance[key].averageScore = Math.round(
          studentPerformance[key].averageScore /
            studentPerformance[key].assessmentCount
        );
      }
    });

    // Filter progress to exclude teachers
    const studentProgress = allProgress.filter(
      (progress) => progress.userId && progress.userId.role !== "teacher"
    );

    const totalStudents = Object.keys(studentPerformance).length;
    const averageClassScore =
      totalStudents > 0
        ? Math.round(
            Object.values(studentPerformance).reduce(
              (acc, s) => acc + s.averageScore,
              0
            ) / totalStudents
          )
        : 0;

    res.json({
      stats: {
        totalStudents,
        averageClassScore,
        assessmentsGiven: allResults.filter(
          (result) => result.userId && result.userId.role !== "teacher"
        ).length,
      },
      studentPerformance: Object.values(studentPerformance),
      progressOverview: studentProgress,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin dashboard
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    const allResults = await AssessmentResult.find();

    const literacyDistribution = {
      literate: users.filter((u) => u.digitalLiteracyLevel === "literate")
        .length,
      "semi-literate": users.filter(
        (u) => u.digitalLiteracyLevel === "semi-literate"
      ).length,
      illiterate: users.filter((u) => u.digitalLiteracyLevel === "illiterate")
        .length,
    };

    const usersByRole = {
      students: users.filter((u) => u.role === "student").length,
      teachers: users.filter((u) => u.role === "teacher").length,
      admins: users.filter((u) => u.role === "admin").length,
    };

    res.json({
      stats: {
        totalUsers: users.length,
        totalAssessments: allResults.length,
        averageScore: Math.round(
          allResults.reduce((acc, r) => acc + r.percentage, 0) /
            (allResults.length || 1)
        ),
      },
      literacyDistribution,
      usersByRole,
      recentUsers: users.slice(-10),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
