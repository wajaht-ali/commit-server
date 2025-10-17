import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateCode = async (req, res) => {
  const { prompt, language } = req.body;

  if (!prompt || !language) {
    return res.status(400).json({ error: "Prompt and language are required." });
  }

  const fullPrompt = `You are an expert coding assistant. 
    Write a clean, efficient, and well-documented code snippet in ${language}.
    The user's request is: "${prompt}".
    Only return the raw code, without any explanation, introductions, or markdown formatting.`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const generatedCode = response.text();

    res.json({ generatedCode });
  } catch (error) {
    console.error("Error generating code with Gemini:", error);
    res.status(500).json({ error: "Failed to generate code." });
  }
};
