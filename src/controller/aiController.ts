import { type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
}

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// The interview domain is configurable
const domain = "React";

// System prompt defining the persona and rules for the AI Interviewer
const systemInstruction = `
You are a professional senior technical interviewer.
You are conducting an interview for the domain: ${domain}.
The interview is conversational.
You must ONLY ask one question at a time. Do not overwhelm the candidate.

When a new interview starts (i.e. the first message), you must ask:
"What is your name?"

After receiving the candidate's name, introduce yourself briefly.
Example: "Nice to meet you [Name]. Today I'll be taking your ${domain} interview. Let's begin."
Then, immediately ask your first technical question.

Do not break out of character. Evaluate the candidate's answers as a real interviewer would, and follow up or move to the next question appropriately.
`;

// In a production environment, conversation history should be stored in a database (e.g., Redis, PostgreSQL)
// For demonstration and current scope, we use a simple in-memory Map keyed by a sessionId.
interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const sessions = new Map<string, ChatMessage[]>();

/**
 * Controller to handle AI Interview interactions
 */
export const getAiResponse = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { sessionId, answer } = req.body;

    // A sessionId is required to maintain conversation state
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required." });
    }

    // Initialize session history if it doesn't exist
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }

    const history = sessions.get(sessionId)!;

    // If the candidate provided an answer, append it to the history
    // If not, and history is empty, it's the start of the interview
    let currentContents = [...history];

    if (answer) {
      const userMessage: ChatMessage = {
        role: "user",
        parts: [{ text: answer }],
      };
      history.push(userMessage);
      currentContents.push(userMessage);
    } else if (history.length === 0) {
      // Start of interview trigger if no answer is provided initially
      const triggerMessage: ChatMessage = {
        role: "user",
        parts: [{ text: "Start the interview." }],
      };
      currentContents.push(triggerMessage);
    } else {
      return res
        .status(400)
        .json({ error: "Please provide an answer to continue the interview." });
    }

    // Generate response using Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: currentContents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const aiText =
      response.text || "I didn't quite get that. Could you repeat?";

    // Append the AI's response to the history for future turns
    history.push({ role: "model", parts: [{ text: aiText }] });

    return res.status(200).json({
      success: true,
      response: aiText,
    });
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    return res.status(500).json({
      error: "Failed to generate AI response.",
      details: error.message,
    });
  }
};
