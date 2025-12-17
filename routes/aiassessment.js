// routes/aiAssessments.js
const express = require("express");
const router = express.Router();
const Assessment = require("../models/Assessment");
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");

// NEW: use @google/genai client
const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ----- role guard: only students can generate -----
async function requireStudent(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await User.findById(req.userId).select("role");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "student") {
      return res
        .status(403)
        .json({ error: "Only students can generate tests" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("requireStudent error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// ----- helper: derive difficulty from age group (for prompt only) -----
function deriveDifficultyFromAge(ageGroup) {
  if (ageGroup === "8-12") return "easy";
  if (ageGroup === "13-18") return "medium";
  return "hard";
}

// ----- helper: get topic-specific prompt -----
function getTopicPrompt(topic) {
  const topics = {
    iq: "IQ/Logical reasoning - focus on patterns, sequences, puzzles, spatial reasoning, and logic problems",
    math: "Mathematics - focus on arithmetic, algebra, geometry, basic calculations, and math reasoning",
    science: "Science - focus on physics, chemistry, biology, basic scientific concepts and principles",
    general: "General knowledge - focus on everyday knowledge, current affairs, geography, history, and common sense",
    computer: "Computer/Technology - focus on programming basics, computer hardware, software, internet, and tech concepts"
  };
  return topics[topic] || topics.general;
}

// ----- helper: call Gemini via GoogleGenAI to generate questions -----
async function callAiProvider({ ageGroup, questionCount, topic }) {
  const difficulty = deriveDifficultyFromAge(ageGroup);
  const topicPrompt = getTopicPrompt(topic);

  const prompt = `
You are a question generator for an assessment test.
Generate ${questionCount} multiple-choice questions as a strict JSON array.

Audience:
- Age group: ${ageGroup}
- Difficulty: ${difficulty}
- Topic: ${topicPrompt}

Each question object must have exactly these fields:
- "id": a short string id (e.g. "1", "2", ...)
- "question": the question text (clear and concise)
- "options": an array of exactly 4 answer options (short, clear, one correct)
- "correctAnswer": one of the options, copied exactly
- "explanation": a short explanation of why the correct answer is right

Return ONLY valid JSON (no comments, no extra text), like:
[
  {
    "id": "1",
    "question": "What is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": "4",
    "explanation": "Basic arithmetic: 2 plus 2 equals 4."
  }
]
`.trim();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text =
    response.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join(" ")
      .trim() || "";

  // Extract JSON from response (handles extra text)
  let questions;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      questions = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("JSON parse error:", e, "matched:", jsonMatch[0]);
      throw new Error("AI returned invalid JSON");
    }
  } else {
    console.error("No JSON array found in response");
    throw new Error("AI did not return valid JSON array");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("AI did not return a questions array");
  }

  return questions.map((q, index) => {
    if (
      !q ||
      typeof q.question !== "string" ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctAnswer !== "string" ||
      !q.options.includes(q.correctAnswer)
    ) {
      throw new Error("Invalid question format from AI");
    }

    return {
      id: q.id || String(index + 1),
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
    };
  });
}

// ----- route: generate AI assessment -----
router.post(
  "/ai-assessments/generate",
  authMiddleware,
  requireStudent,
  async (req, res) => {
    try {
      const { ageGroup, questionCount, timeLimit, topic } = req.body;

      // Validate required fields
      if (!ageGroup || !questionCount || !topic) {
        return res
          .status(400)
          .json({ error: "ageGroup, questionCount, and topic are required" });
      }

      // Validate topic
      const validTopics = ["iq", "math", "science", "general", "computer"];
      if (!validTopics.includes(topic)) {
        return res
          .status(400)
          .json({ 
            error: `Invalid topic. Must be one of: ${validTopics.join(", ")}` 
          });
      }

      const countNum = Number(questionCount);
      if (Number.isNaN(countNum) || countNum < 3 || countNum > 30) {
        return res
          .status(400)
          .json({ error: "questionCount must be between 3 and 30" });
      }

      // optional timer: default 10 if not provided / invalid
      let timeLimitNum = Number(timeLimit);
      if (Number.isNaN(timeLimitNum) || timeLimitNum <= 0 || timeLimitNum > 180) {
        timeLimitNum = 10;
      }

      const cleanedQuestions = await callAiProvider({
        ageGroup,
        questionCount: countNum,
        topic,
      });

      const topicNames = {
        iq: "IQ & Logical Reasoning",
        math: "Mathematics",
        science: "Science",
        general: "General Knowledge",
        computer: "Computer Science"
      };

      const assessmentDoc = await Assessment.create({
        title: `AI ${topicNames[topic]} Test (${ageGroup})`,
        description: `Auto-generated ${topicNames[topic].toLowerCase()} assessment for age ${ageGroup}.`,
        skillCategory: topic,
        totalPoints: cleanedQuestions.length,
        timeLimit: timeLimitNum,
        questions: cleanedQuestions,
        isAiGenerated: true,
      });

      res.json({ assessment: assessmentDoc });
    } catch (err) {
      console.error("AI assessment generation error:", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to generate AI assessment" });
    }
  }
);

module.exports = router;
