const express = require("express")
const authMiddleware = require("../middleware/auth")
const User = require("../models/User")

const router = express.Router()

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user profile
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const { name, profilePicture } = req.body
    const user = await User.findByIdAndUpdate(req.userId, { name, profilePicture }, { new: true }).select("-password")
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
