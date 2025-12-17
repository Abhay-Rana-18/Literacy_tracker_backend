const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const assessmentRoutes = require("./routes/assessments");
const resultRoutes = require("./routes/results");
const learningRoutes = require("./routes/learningModules");
const dashboardRoutes = require("./routes/dashboard");
const userRoutes = require("./routes/users");
const aiAssessmentsRoutes = require("./routes/aiassessment");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb://localhost:27017/digital-skills-tracker"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/learning-modules", learningRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api", aiAssessmentsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend server is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
