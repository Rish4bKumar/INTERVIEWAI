export interface BehavioralMetrics {
  eyeContactScore: number;
  headMovementScore: number;
  speakingPace: number;
  confidenceScore: number;
  timestamp: number;
}

export interface TranscriptEntry {
  speaker: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface InterviewData {
  jobField: string;
  transcript: TranscriptEntry[];
  behavioralMetrics: BehavioralMetrics[];
  duration: number;
  recording?: Blob[];
}

export interface AIFeedbackSummary {
  overall_score?: number;
  job_match_score?: number;
  communication_score?: number;
  behavior_score?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  final_verdict?: string;
}

export interface InterviewHistoryRecord {
  id: string;
  userId: string;
  createdAt: string;
  interviewData: InterviewData;
  aiFeedback: AIFeedbackSummary | null;
}

const INTERVIEW_HISTORY_KEY = "interview_history_v1";

const readAll = (): InterviewHistoryRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(INTERVIEW_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InterviewHistoryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (records: InterviewHistoryRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INTERVIEW_HISTORY_KEY, JSON.stringify(records));
};

export const getInterviewHistoryForUser = (userId: string): InterviewHistoryRecord[] => {
  return readAll()
    .filter((record) => record.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getInterviewHistoryRecordById = (
  userId: string,
  id: string,
): InterviewHistoryRecord | null => {
  const records = getInterviewHistoryForUser(userId);
  return records.find((record) => record.id === id) || null;
};

export const saveInterviewHistoryRecord = (
  userId: string,
  interviewData: InterviewData,
  aiFeedback: AIFeedbackSummary | null,
): InterviewHistoryRecord => {
  const records = readAll();
  const next: InterviewHistoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    createdAt: new Date().toISOString(),
    interviewData,
    aiFeedback,
  };

  const updated = [next, ...records].slice(0, 60);
  writeAll(updated);
  return next;
};
