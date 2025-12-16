const express = require("express")
const authMiddleware = require("../middleware/auth")
const AssessmentResult = require("../models/AssessmentResult")

const router = express.Router()

// Get user's results
router.get("/", authMiddleware, async (req, res) => {
  try {
    const results = await AssessmentResult.find({ userId: req.userId }).populate("assessmentId")
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get result details
router.get("/:resultId", authMiddleware, async (req, res) => {
  try {
    const result = await AssessmentResult.findById(req.params.resultId).populate("assessmentId")
    if (!result) {
      return res.status(404).json({ error: "Result not found" })
    }

    if (result.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
