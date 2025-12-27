
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
    return response.text || "Merry Christmas! May your days be filled with magic. 圣诞快乐，愿温暖与奇迹与你同在。";
  } catch (error) {
    console.error("Gemini Greeting Error:", error);
    return "Merry Christmas! May love and light fill your heart. 圣诞快乐，愿爱与光亮充满你的心房。";
  }
};
