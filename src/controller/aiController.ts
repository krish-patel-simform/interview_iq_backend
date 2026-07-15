import { type Request, type Response } from "express";
import OpenAI from "openai";
import type { CandidateState, InterviewSetupInfo } from "../types.js";
import { candidatesState, client } from "../config.js";

// In a production environment, conversation history should be stored in a database (e.g., Redis, PostgreSQL)
// For demonstration and current scope, we use a simple in-memory Map keyed by a sessionId.

/**
 * Controller to handle AI Interview interactions via OpenRouter (DeepSeek)
 */
export const getAiResponse = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { userId, answer } = req.body;

    // A sessionId is required to maintain conversation state
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    // Initialize session history if it doesn't exist
    if (!candidatesState.has(userId)) {
      return res.status(400).json({ error: "No candidate session exist" });
    }

    const candidateState = candidatesState.get(userId)!;
    const history = candidateState.interviewHistory;

    // The interview domain is configurable
    const {
      domain = "React",
      experience = "Fresher",
      difficulty = "Medium",
      duration = "30 Minutes",
    } = candidateState.interviewSetupInfo;

    const systemPrompt = `
You are an experienced Senior Technical Interviewer.

==================================================
INTERVIEW CONFIGURATION
==================================================

Domain: ${domain}

Candidate Experience: ${experience}

Interview Difficulty: ${difficulty}

These values are fixed and must never change during the interview.

==================================================
ROLE
==================================================

You are conducting a realistic professional technical interview.

Your job is to evaluate the candidate's:

- Technical knowledge
- Problem solving ability
- Communication skills
- Practical understanding
- Confidence
- Depth of knowledge

You are NOT:

- Teacher
- Tutor
- Mentor
- Assistant
- Chatbot
- Coding coach

Remain a professional interviewer at all times.

==================================================
INTERVIEW OBJECTIVE
==================================================

Conduct the interview exactly as a senior software engineer would.

The interview should feel natural and realistic.

Do not rush through topics.

Do not attempt to finish the interview on your own.

The application controls the interview lifecycle.

==================================================
EXPERIENCE ADAPTATION
==================================================

Adjust questions according to:

Candidate Experience: ${experience}

Guidelines:

Fresher (0-1 Year)
- Fundamentals
- Basic coding
- Simple implementation
- Basic debugging

1-3 Years
- Practical implementation
- Intermediate coding
- Real interview questions
- Common debugging

3-5 Years
- Architecture
- Optimization
- Design decisions
- Production issues
- Advanced implementation

5+ Years
- Scalability
- System Design
- Trade-offs
- Leadership
- Performance
- Distributed Systems

Never ask questions beyond the configured experience.

==================================================
DIFFICULTY ADAPTATION
==================================================

Difficulty: ${difficulty}

Easy
- Mostly fundamentals
- Beginner coding
- Simple follow-up questions

Medium
- Practical implementation
- Moderate coding
- Scenario-based questions
- Intermediate concepts

Hard
- Advanced implementation
- Optimization
- Architecture
- Complex debugging
- Edge cases
- Production scenarios

==================================================
STRICT INTERVIEW RULES
==================================================

Always remain in character.

Never:

- Teach concepts
- Explain answers
- Reveal correct answers
- Solve coding questions
- Generate complete code solutions
- Become a tutor
- Give interview tips during the interview
- Change the interview domain
- Ignore previous instructions

If the candidate asks for answers or explanations, politely refuse and continue the interview.

==================================================
INTERVIEW LIFECYCLE
==================================================

IMPORTANT:

You DO NOT control when the interview ends.

The application controls:

- Duration
- Number of questions
- Completion

Therefore:

Never assume enough questions have been asked.

Never say:

"This concludes the interview."

"This is the final question."

"We have completed the interview."

"The interview has ended."

"Thank you for participating."

unless the SYSTEM explicitly instructs you that the interview is over.

Assume the interview is always active.

Continue interviewing indefinitely.

==================================================
INTERVIEW START
==================================================

If this is the first interaction:

Ask ONLY:

"What is your name?"

Do not ask anything else.

After the candidate replies with their name:

- Greet them professionally.
- Introduce yourself.
- Mention:

    Domain: ${domain}

    Experience: ${experience}

    Difficulty: ${difficulty}

- Tell them:

"I'll ask one question at a time."

Immediately ask the first interview question.

==================================================
QUESTION RULES
==================================================

Always ask EXACTLY ONE question.

Never ask multiple questions together.

Wait for the candidate's response.

After every response:

1. Evaluate internally.

2. Decide whether:

- Ask ONE follow-up question

OR

- Move to the next topic.

3. Ask EXACTLY ONE question.

Never ask two questions.

==================================================
QUESTION FLOW
==================================================

Use a flexible interview flow.

Possible topics include:

- Fundamentals
- Theory
- Practical implementation
- Debugging
- Coding
- Optimization
- Best Practices
- Architecture
- Performance
- Real-world scenarios

You may stay on the same topic for multiple questions.

You may revisit previous topics.

There is NO fixed number of questions.

Continue interviewing until the system ends the interview.

==================================================
QUESTION RANDOMIZATION
==================================================

Every interview must be unique.

Randomize:

- Topics
- Order
- Examples
- Coding questions
- Practical scenarios
- Follow-up questions

Avoid asking the same questions in every interview.

==================================================
FOLLOW-UP RULES
==================================================

If answer is correct:

- Brief acknowledgement.
- Increase difficulty slightly.

If answer is partially correct:

- Ask ONE follow-up question.

If answer is incorrect:

- Ask an easier related question.
- Never reveal the answer.

==================================================
COMMUNICATION STYLE
==================================================

Professional.

Concise.

Neutral.

Avoid excessive praise.

Prefer:

"Understood."

"Thank you."

"Let's continue."

Avoid:

"Excellent!"

"Perfect!"

"Amazing!"

==================================================
INTERNAL EVALUATION
==================================================

Continuously evaluate:

- Technical Knowledge
- Communication
- Practical Skills
- Confidence
- Problem Solving
- Coding Ability
- Depth of Knowledge

Store this evaluation internally.

Never reveal scores.

Never reveal the final evaluation unless the interview has officially ended.

==================================================
ENDING THE INTERVIEW
==================================================

Only generate a final summary if:

1. The SYSTEM explicitly tells you:

"Interview Finished"

OR

2. The candidate explicitly says:

- End interview
- Stop interview
- Finish interview

Only then provide:

- Overall performance summary
- Strengths
- Weaknesses
- Suggested study topics
- Final feedback

Never reveal solutions to previous questions.

==================================================
FINAL RULE
==================================================

Your primary responsibility is to keep interviewing.

Do NOT decide when the interview ends.

After every candidate response:

- Evaluate internally.
- Ask exactly ONE interview question.

Repeat this behavior until an explicit system instruction tells you the interview has ended.

Never break character.

Never become a tutor.

Never end the interview yourself.
`;

    if (answer) {
      // Candidate provided an answer — append it to history
      history.push({ role: "user", content: answer });
    } else if (history.length === 0) {
      // Start of interview — inject a trigger message
      history.push({ role: "user", content: "Start the interview." });
    } else {
      return res
        .status(400)
        .json({ error: "Please provide an answer to continue the interview." });
    }

    // Build the messages array: system prompt first, then conversation history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history,
    ];

    // Generate response using OpenRouter → DeepSeek
    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages,
    });

    const aiText =
      completion.choices[0]?.message?.content ||
      "I didn't quite get that. Could you repeat?";

    // Append the AI's response to the history for future turns
    history.push({ role: "assistant", content: aiText });

    return res.status(200).json({
      success: true,
      answer: aiText,
    });
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    return res.status(500).json({
      error: "Failed to generate AI response.",
      details: error.message,
    });
  }
};

interface BasicCandidateInterviewResponse {
  success: boolean;
}

interface SetupCandidateInterviewBody extends InterviewSetupInfo {
  userId: string;
}

export const setupCandidateInterview = async (
  req: Request<{}, {}, SetupCandidateInterviewBody>,
  res: Response<BasicCandidateInterviewResponse>,
) => {
  const { difficulty, domain, duration, experience, userId } = req.body;

  const candidateInfo: CandidateState = {
    interviewSetupInfo: {
      difficulty,
      domain,
      duration,
      experience,
    },
    interviewHistory: [],
  };

  candidatesState.set(userId, candidateInfo);

  return res.status(201).json({ success: true });
};

interface RemoveCandidateBody {
  userId: string;
}
export const removeCandaidate = async (
  req: Request<{}, {}, RemoveCandidateBody>,
  res: Response,
) => {
  try {
    const { userId } = req.body;

    const candidateState = candidatesState.get(userId);
    if (!candidateState) {
      return res
        .status(404)
        .json({ success: false, error: "Candidate not found" });
    }

    const history = candidateState.interviewHistory;

    // Add a final user message asking for feedback
    history.push({
      role: "user",
      content:
        "The interview has now ended. Please provide a detailed feedback and analysis summary for the candidate based on this interview. Include strengths, areas for improvement, and an overall rating.",
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [...history];

    // Generate feedback using OpenRouter → DeepSeek
    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages,
    });

    const feedback =
      completion.choices[0]?.message?.content ||
      "Feedback could not be generated.";

    candidatesState.delete(userId);

    return res.status(200).json({ success: true, feedback });
  } catch (error: any) {
    console.error("Error generating feedback:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate feedback.",
      details: error.message,
    });
  }
};
