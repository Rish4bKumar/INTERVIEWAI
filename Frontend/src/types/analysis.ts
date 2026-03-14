export interface ResumeAnalysisResult {
    profession: string;
    extracted_text: string;
    skills_found: string[];
    experience: string[];
    education: string[];
    matched_skills: string[];
    missing_skills: string[];
    profession_ats_score: number;
    suggestions: string;
  }
  