require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

async function main() {
  console.log("Key length:", process.env.GEMINI_API_KEY?.length);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: "Say hi in one word" }] }],
  });

  // Safely extract text from candidates/parts
  const text =
    response.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join(" ")
      .trim() || "";

  console.log("Output:", text);
}

main().catch(console.error);
