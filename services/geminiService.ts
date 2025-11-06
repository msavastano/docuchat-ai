
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeDocuments(documentContent: string, query: string): Promise<string> {
  try {
    const model = 'gemini-2.5-pro';

    const prompt = `
      You are an expert document analysis assistant named DocuChat AI. Your task is to answer questions based ONLY on the content of the documents provided below. Do not use any external knowledge or make assumptions. If the answer cannot be found within the provided documents, you must state that clearly.

      Here is the combined content of the uploaded documents:
      ---
      ${documentContent}
      ---

      Based on the documents above, please answer the following question:
      "${query}"
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error analyzing documents with Gemini:", error);
    if (error instanceof Error) {
        return `An error occurred while communicating with the AI: ${error.message}`;
    }
    return "An unknown error occurred while communicating with the AI.";
  }
}
