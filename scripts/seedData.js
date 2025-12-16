const mongoose = require("mongoose")
const dotenv = require("dotenv")
const User = require("../models/User")
const Assessment = require("../models/Assessment")
const LearningModule = require("../models/LearningModule")

dotenv.config()

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/digital-skills-tracker")
    console.log("Connected to MongoDB")

    // Clear existing data
    await User.deleteMany({})
    await Assessment.deleteMany({})
    await LearningModule.deleteMany({})
    console.log("Cleared existing data")

    // Create test users
    const users = await User.create([
      {
        email: "student@example.com",
        password: "password123",
        name: "John Student",
        role: "student",
        digitalLiteracyLevel: "semi-literate",
      },
      {
        email: "teacher@example.com",
        password: "password123",
        name: "Jane Teacher",
        role: "teacher",
        digitalLiteracyLevel: "literate",
      },
      {
        email: "admin@example.com",
        password: "password123",
        name: "Admin User",
        role: "admin",
        digitalLiteracyLevel: "literate",
      },
    ])
    console.log("Created test users")

    // Create assessments
    const assessments = await Assessment.create([
      {
        title: "Basic Digital Skills",
        description: "Test your basic digital literacy",
        skillCategory: "basic",
        totalPoints: 100,
        timeLimit: 15,
        questions: [
          {
            id: "q1",
            question: "What is an email?",
            options: ["A tool to send messages", "A storage device", "A programming language", "None of the above"],
            correctAnswer: "A tool to send messages",
            explanation: "Email is an electronic mail system for sending and receiving messages over the internet.",
          },
          {
            id: "q2",
            question: "Which is a web browser?",
            options: ["Firefox", "Microsoft Word", "Excel", "Paint"],
            correctAnswer: "Firefox",
            explanation: "Firefox is a web browser used to browse the internet.",
          },
          {
            id: "q3",
            question: "What does URL stand for?",
            options: [
              "Uniform Resource Locator",
              "Universal Reference Link",
              "United Resource List",
              "Uniform Reference Language",
            ],
            correctAnswer: "Uniform Resource Locator",
            explanation: "URL (Uniform Resource Locator) is the web address of a website.",
          },
          {
            id: "q4",
            question: "Which is NOT a search engine?",
            options: ["Google", "Firefox", "Bing", "DuckDuckGo"],
            correctAnswer: "Firefox",
            explanation: "Firefox is a web browser, not a search engine.",
          },
          {
            id: "q5",
            question: "What is a password?",
            options: ["A secret code to access accounts", "A computer part", "A type of email", "A browser extension"],
            correctAnswer: "A secret code to access accounts",
            explanation: "A password is a confidential word or number to protect your accounts.",
          },
        ],
      },
      {
        title: "Intermediate Digital Skills",
        description: "Test your intermediate digital knowledge",
        skillCategory: "intermediate",
        totalPoints: 100,
        timeLimit: 20,
        questions: [
          {
            id: "q1",
            question: "What is a cloud storage service?",
            options: ["Google Drive", "Microsoft Word", "Adobe Reader", "Notepad"],
            correctAnswer: "Google Drive",
            explanation: "Google Drive is a cloud storage service for storing and sharing files online.",
          },
          {
            id: "q2",
            question: "What is SSL?",
            options: ["Secure Socket Layer - encrypts data", "A file type", "A computer virus", "A browser extension"],
            correctAnswer: "Secure Socket Layer - encrypts data",
            explanation: "SSL encrypts data transmitted between your browser and websites.",
          },
          {
            id: "q3",
            question: "What is a VPN?",
            options: ["Virtual Private Network", "A video player", "A file format", "A messaging app"],
            correctAnswer: "Virtual Private Network",
            explanation: "VPN creates a secure connection and masks your IP address.",
          },
        ],
      },
    ])
    console.log("Created assessments")

    // Create learning modules
    const modules = await LearningModule.create([
      {
        title: "Getting Started with Computers",
        description: "Learn the basics of computer usage",
        skillLevel: "basic",
        order: 1,
        duration: 120,
        lessons: [
          {
            id: "lesson1",
            title: "Introduction to Computers",
            content: "Learn what computers are and their basic components.",
            videoUrl: "https://example.com/video1",
            resourceUrl: "https://example.com/resource1",
          },
          {
            id: "lesson2",
            title: "Using the Mouse and Keyboard",
            content: "Master mouse and keyboard controls.",
            videoUrl: "https://example.com/video2",
            resourceUrl: "https://example.com/resource2",
          },
          {
            id: "lesson3",
            title: "File Management",
            content: "Organize and manage your files.",
            videoUrl: "https://example.com/video3",
            resourceUrl: "https://example.com/resource3",
          },
        ],
      },
      {
        title: "Internet and Email Basics",
        description: "Learn to browse the internet and use email",
        skillLevel: "basic",
        order: 2,
        duration: 150,
        lessons: [
          {
            id: "lesson1",
            title: "Introduction to the Internet",
            content: "Understand what the internet is and how it works.",
            videoUrl: "https://example.com/video4",
            resourceUrl: "https://example.com/resource4",
          },
          {
            id: "lesson2",
            title: "Web Browsing",
            content: "Learn to navigate websites and search the internet.",
            videoUrl: "https://example.com/video5",
            resourceUrl: "https://example.com/resource5",
          },
          {
            id: "lesson3",
            title: "Email Basics",
            content: "Create and use email accounts.",
            videoUrl: "https://example.com/video6",
            resourceUrl: "https://example.com/resource6",
          },
        ],
      },
      {
        title: "Microsoft Office Essentials",
        description: "Master Word, Excel, and PowerPoint",
        skillLevel: "intermediate",
        order: 3,
        duration: 240,
        lessons: [
          {
            id: "lesson1",
            title: "Microsoft Word Basics",
            content: "Create and format documents.",
            videoUrl: "https://example.com/video7",
            resourceUrl: "https://example.com/resource7",
          },
          {
            id: "lesson2",
            title: "Excel Spreadsheets",
            content: "Work with data and formulas.",
            videoUrl: "https://example.com/video8",
            resourceUrl: "https://example.com/resource8",
          },
          {
            id: "lesson3",
            title: "PowerPoint Presentations",
            content: "Create professional presentations.",
            videoUrl: "https://example.com/video9",
            resourceUrl: "https://example.com/resource9",
          },
        ],
      },
    ])
    console.log("Created learning modules")

    console.log("Database seeding completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

seedDatabase()
