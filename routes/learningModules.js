const express = require("express");
const authMiddleware = require("../middleware/auth");
const LearningModule = require("../models/LearningModule");
const UserProgress = require("../models/UserProgress");
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

// Get all learning modules
router.get("/", async (req, res) => {
  try {
    const modules = await LearningModule.find().sort({ order: 1 });
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single module
router.get("/:id", async (req, res) => {
  try {
    const module = await LearningModule.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }
    res.json(module);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new learning module (Teacher/Admin only)
router.post("/", authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const { title, description, skillLevel, lessons, duration, order } =
      req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    const module = new LearningModule({
      title,
      description,
      skillLevel: skillLevel || "basic",
      lessons: lessons || [],
      duration,
      order,
    });

    await module.save();

    res.status(201).json({
      message: "Learning module created successfully",
      module,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update learning module (Teacher/Admin only)
router.put("/:id", authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const { title, description, skillLevel, lessons, duration, order } =
      req.body;
    const module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    if (title) module.title = title;
    if (description) module.description = description;
    if (skillLevel) module.skillLevel = skillLevel;
    if (lessons) module.lessons = lessons;
    if (duration !== undefined) module.duration = duration;
    if (order !== undefined) module.order = order;

    await module.save();

    res.json({
      message: "Learning module updated successfully",
      module,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete learning module (Teacher/Admin only)
router.delete("/:id", authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    // Check if there are any progress records
    const progressCount = await UserProgress.countDocuments({
      moduleId: req.params.id,
    });

    if (progressCount > 0) {
      return res.status(400).json({
        error: `Cannot delete module. ${progressCount} student(s) are using this module.`,
        progressCount,
      });
    }

    await LearningModule.findByIdAndDelete(req.params.id);

    res.json({
      message: "Learning module deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get module statistics (Teacher/Admin only)
router.get(
  "/:id/statistics",
  authMiddleware,
  isTeacherOrAdmin,
  async (req, res) => {
    try {
      const module = await LearningModule.findById(req.params.id);

      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      const progressRecords = await UserProgress.find({
        moduleId: req.params.id,
      }).populate("userId", "name email");

      const totalStudents = progressRecords.length;
      const completedStudents = progressRecords.filter(
        (p) => p.completionPercentage === 100
      ).length;
      const averageCompletion =
        totalStudents > 0
          ? Math.round(
              progressRecords.reduce(
                (acc, p) => acc + p.completionPercentage,
                0
              ) / totalStudents
            )
          : 0;

      res.json({
        module: {
          id: module._id,
          title: module.title,
          totalLessons: module.lessons.length,
        },
        statistics: {
          totalStudents,
          completedStudents,
          inProgress: totalStudents - completedStudents,
          averageCompletion,
        },
        studentProgress: progressRecords.map((p) => ({
          studentName: p.userId.name,
          studentEmail: p.userId.email,
          completionPercentage: p.completionPercentage,
          lessonsCompleted: p.lessonsCompleted.length,
          lastAccessed: p.lastAccessedAt,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get user progress for modules
router.get("/progress/me", authMiddleware, async (req, res) => {
  try {
    const progress = await UserProgress.find({ userId: req.userId }).populate(
      "moduleId"
    );
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lesson completion
router.post("/complete-lesson", authMiddleware, async (req, res) => {
  try {
    const { moduleId, lessonId } = req.body;

    let progress = await UserProgress.findOne({ userId: req.userId, moduleId });
    if (!progress) {
      progress = new UserProgress({
        userId: req.userId,
        moduleId,
        lessonsCompleted: [lessonId],
        lastAccessedAt: new Date(),
      });
    } else if (!progress.lessonsCompleted.includes(lessonId)) {
      progress.lessonsCompleted.push(lessonId);
      progress.lastAccessedAt = new Date();
    } else {
      progress.lastAccessedAt = new Date();
    }

    const module = await LearningModule.findById(moduleId);
    progress.completionPercentage = Math.round(
      (progress.lessonsCompleted.length / module.lessons.length) * 100
    );

    if (progress.completionPercentage === 100 && !progress.completedAt) {
      progress.completedAt = new Date();
    }

    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
