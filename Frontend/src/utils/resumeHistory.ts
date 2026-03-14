export interface ResumeStoredResults {
  profession?: string;
  profession_ats_score?: number;
  missing_skills?: string[];
  [key: string]: unknown;
}

export interface ResumeHistoryRecord {
  id: string;
  userId: string;
  createdAt: string;
  fileName: string;
  mode: "ats" | "parse";
  results: ResumeStoredResults;
}

const RESUME_HISTORY_KEY = "resume_history_v1";

const readAll = (): ResumeHistoryRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RESUME_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ResumeHistoryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (records: ResumeHistoryRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RESUME_HISTORY_KEY, JSON.stringify(records));
};

export const saveResumeHistoryRecord = (
  userId: string,
  fileName: string,
  results: ResumeStoredResults,
  mode: "ats" | "parse" = "ats",
): ResumeHistoryRecord => {
  const records = readAll();
  const next: ResumeHistoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    createdAt: new Date().toISOString(),
    fileName,
    mode,
    results,
  };
  const updated = [next, ...records].slice(0, 80);
  writeAll(updated);
  return next;
};

export const getResumeHistoryForUser = (userId: string): ResumeHistoryRecord[] => {
  return readAll()
    .filter((record) => record.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getResumeHistoryRecordById = (
  userId: string,
  id: string,
): ResumeHistoryRecord | null => {
  return getResumeHistoryForUser(userId).find((record) => record.id === id) || null;
};
