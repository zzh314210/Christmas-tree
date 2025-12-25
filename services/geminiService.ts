
import { GoogleGenAI } from "@google/genai";

export const generateGreeting = async () => {
  try {
    // Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a short, magical, one-sentence Christmas blessing in Chinese. Something about love, light, and memories.",
    });
    // The response.text property (not a method) directly returns the extracted string output.
    return response.text || "圣诞快乐，愿你的世界充满温暖与奇迹。";
  } catch (error) {
    console.error("Gemini Greeting Error:", error);
    return "圣诞快乐，温暖常伴！";
  }
};
