export type InterviewSetupInfo = {
  domain: string;
  experience: string;
  difficulty: string;
  duration: string;
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type InterviewHistory = ChatMessage[];

export type CandidateState = {
  interviewSetupInfo: InterviewSetupInfo;
  interviewHistory: InterviewHistory;
};
