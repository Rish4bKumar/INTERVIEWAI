import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
def safe_avg(values, default=70):
    return sum(values) / len(values) if values else default
def generate_interview_feedback(transcript, jobField, behavioralMetrics, duration):
    # If no recorded user responses
    user_turns = [t for t in transcript if t.get("speaker") == "user"]
    if len(user_turns) == 0:
        fallback = {
            "overall_score": 40,
            "job_match_score": 35,
            "communication_score": 20,
            "behavior_score": 50,
            "strengths": ["Interview session started successfully."],
            "weaknesses": [
                "No user responses detected in the transcript.",
                "Microphone may not be working or audio not recorded."
            ],
            "recommendations": [
                "Check your microphone before starting the interview.",
                "Answer the questions aloud so the system can analyze properly."
            ],
            "star_analysis": {
                "uses_star": False,
                "notes": "Cannot detect STAR method with zero responses."
            },
            "final_verdict": "Not Enough Data"
        }
        return json.dumps(fallback, ensure_ascii=False)
    # Safe averages for behavior
    eye = safe_avg([m.get("eyeContactScore", 70) for m in behavioralMetrics])
    head = safe_avg([m.get("headMovementScore", 70) for m in behavioralMetrics])
    pace = safe_avg([m.get("speakingPace", 130) for m in behavioralMetrics])
    confidence = safe_avg([m.get("confidenceScore", 70) for m in behavioralMetrics])
    transcript_text = "\n".join([f"{t['speaker']}: {t['text']}" for t in transcript])
    # NEW Gemini 2.0 Prompt (forces JSON only)
    prompt = f"""
You are an expert technical interviewer and HR evaluator.
Analyze the candidate for the job role: {jobField}
### INTERVIEW TRANSCRIPT:
{transcript_text}
### BEHAVIOR METRICS:
Eye Contact: {eye}
Head Movement: {head}
Speaking Pace (wpm): {pace}
Confidence: {confidence}
### DURATION:
{duration} milliseconds
Return ONLY valid JSON in this exact structure:
{{
  "overall_score": <0-100>,
  "job_match_score": <0-100>,
  "communication_score": <0-100>,
  "behavior_score": <0-100>,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommendations": ["...", "..."],
  "star_analysis": {{
    "uses_star": true or false,
    "notes": "..."
  }},
  "final_verdict": "Hire" | "Good Fit" | "Needs Improvement" | "Not Ready"
}}
"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        # MUST use list input
        res = model.generate_content([prompt])
        text = res.text.strip()
        # Validate JSON
        try:
            json.loads(text)
            return text
        except:
            # Backup JSON if model output isn’t JSON
            fallback = {
                "overall_score": 55,
                "job_match_score": 50,
                "communication_score": 52,
                "behavior_score": 48,
                "strengths": ["Fallback used due to invalid JSON."],
                "weaknesses": ["Model output could not be parsed."],
                "recommendations": ["Try again with clearer answers."],
                "star_analysis": {
                    "uses_star": False,
                    "notes": "STAR detection unavailable."
                },
                "final_verdict": "Needs Improvement"
            }
            return json.dumps(fallback, ensure_ascii=False)
    except Exception as e:
        print("Gemini Error:", e)
        fallback = {
            "overall_score": 50,
            "job_match_score": 50,
            "communication_score": 50,
            "behavior_score": 50,
            "strengths": ["AI service failed; using generic evaluation."],
            "weaknesses": ["Could not connect to AI model."],
            "recommendations": ["Check your API key or network."],
            "star_analysis": {
                "uses_star": False,
                "notes": "Could not analyze STAR method."
            },
            "final_verdict": "Needs Improvement"
        }
        return json.dumps(fallback, ensure_ascii=False)