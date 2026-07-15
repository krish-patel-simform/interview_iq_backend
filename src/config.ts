import { config } from "dotenv";
import type { CandidateState } from "./types.js";
config();

import OpenAI from "openai";

// Create an User State
export const candidatesState = new Map<string, CandidateState>();

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.warn(
    "WARNING: OPENROUTER_API_KEY is not defined in the environment.",
  );
}

// Initialize OpenAI client pointing at OpenRouter
export const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: apiKey || "",
  defaultHeaders: {
    // Optional but recommended by OpenRouter for ranking/analytics
    "HTTP-Referer": "http://localhost:4000",
    "X-Title": "AIInterviewIQ",
  },
});
