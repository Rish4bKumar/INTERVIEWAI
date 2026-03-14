import os
import json
import time
import re
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from openai import OpenAI

load_dotenv()

# -------------------- OpenRouter Client --------------------
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY not found in .env")

client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)

# -------------------- Utility Functions --------------------
def clamp(val: float, lo: float = 0.0, hi: float = 100.0) -> float:
    try:
        v = float(val)
    except Exception:
        return lo
    return max(lo, min(hi, v))


def safe_avg(values: List[Any], default: float = 70.0) -> float:
    nums = []
    for v in values or []:
        if v is None:
            continue
        try:
            nums.append(float(v))
        except Exception:
            continue
    return sum(nums) / len(nums) if nums else default


def extract_first_json(s: str) -> Optional[str]:
    start = s.find('{')
    if start == -1:
        return None
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(s)):
        ch = s[i]
        if in_string:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return s[start:i + 1]
    return None


def extract_json_via_regex(text: str) -> Optional[str]:
    try:
        match = re.search(r'\{(?:[^{}]|(?:\{[^{}]*\}))*\}', text, re.DOTALL)
        if match:
            return match.group(0)
    except Exception:
        pass
    return None


# -------------------- Prompt Builder --------------------
def make_prompt(jobField: str, transcript_text: str, eye: float, head: float,
                pace: float, confidence: float, duration_ms: int, 
                user_response_count: int, avg_response_length: int) -> str:
    return f"""
You are an expert Senior Technical Interviewer and HR Behavioral Specialist analyzing a real interview.

STRICT RULES:
1. Output ONLY valid JSON, no markdown, no explanations.
2. Analyze the ACTUAL transcript content deeply - read every response carefully.
3. Calculate scores based on REAL performance, not examples.
4. Provide SPECIFIC recommendations based on what the candidate actually said or didn't say.

CANDIDATE ROLE:
{jobField}

INTERVIEW TRANSCRIPT (ANALYZE THIS CAREFULLY):
{transcript_text}

INTERVIEW STATISTICS:
- Total User Responses: {user_response_count}
- Average Response Length: {avg_response_length} words
- Interview Duration: {duration_ms/1000:.1f} seconds ({duration_ms/60000:.1f} minutes)

BEHAVIOR METRICS:
- Eye Contact: {eye:.1f}/100
- Head Movement: {head:.1f}/100
- Speaking Pace: {pace:.1f}/100
- Confidence: {confidence:.1f}/100

DETAILED SCORING CRITERIA:

1. overall_score (0-100):
   - Base: Average of job_match_score, communication_score, and behavior_score
   - Adjust based on: Response completeness, engagement level, answer quality
   - If responses are very short (<20 words avg): reduce by 10-15 points
   - If responses show depth and examples: add 5-10 points

2. job_match_score (0-100):
   - 90-100: Strong alignment, specific relevant experience mentioned
   - 70-89: Good match, some relevant skills/experience
   - 50-69: Partial match, generic responses
   - 30-49: Weak match, little relevant experience
   - 0-29: No relevant experience mentioned
   - Look for: Specific technologies, projects, experiences related to {jobField}

3. communication_score (0-100):
   - 90-100: Clear, articulate, well-structured answers
   - 70-89: Generally clear with minor issues
   - 50-69: Some clarity issues, rambling or too brief
   - 30-49: Unclear, hard to follow
   - 0-29: Very poor communication
   - Consider: Answer structure, vocabulary, explanation clarity

4. behavior_score (0-100):
   - Calculate: (Eye Contact + Head Movement + Speaking Pace + Confidence) / 4
   - Current calculation: ({eye:.1f} + {head:.1f} + {pace:.1f} + {confidence:.1f}) / 4 = {(eye + head + pace + confidence) / 4:.1f}

5. strengths (2-4 items):
   - Be SPECIFIC: Reference actual things they said
   - Examples: "Mentioned experience with [specific tech]" not "Has experience"
   - If they used STAR method, mention it
   - If responses were detailed, mention it

6. weaknesses (2-4 items):
   - Be SPECIFIC: What exactly was missing or could improve
   - Examples: "Did not provide specific examples when asked about [topic]"
   - "Responses were too brief (average {avg_response_length} words)"
   - "Did not use STAR method for behavioral questions"

7. recommendations (2-4 items):
   - Be ACTIONABLE and SPECIFIC to their performance
   - Base on actual gaps: "Practice explaining [specific topic they struggled with]"
   - "Use STAR method for future behavioral questions" (if they didn't)
   - "Expand on technical details - average response was only {avg_response_length} words"
   - "Prepare specific examples related to {jobField}"

8. star_analysis:
   - Check if ANY response used STAR format (Situation, Task, Action, Result)
   - Look for structured answers with context, challenge, action, outcome
   - Notes should be specific: "Used STAR in response about [topic]" or "No STAR structure detected"

9. final_verdict:
   - "Excellent" (80+): Strong candidate, ready for role
   - "Good" (60-79): Solid candidate with some areas to improve
   - "Needs Improvement" (40-59): Potential but needs significant development
   - "Not Ready" (<40): Not prepared for this role

CRITICAL: 
- Read the transcript word-by-word
- Base EVERY score and recommendation on what you actually see in the transcript
- If responses are generic/vague, reflect that in scores
- If responses show expertise, reflect that in scores
- Recommendations must address SPECIFIC issues from this interview

OUTPUT JSON with REAL calculated values:
{{
  "overall_score": <calculate based on actual performance>,
  "job_match_score": <calculate based on relevance to {jobField}>,
  "communication_score": <calculate based on clarity and structure>,
  "behavior_score": {(eye + head + pace + confidence) / 4:.1f},
  "strengths": [<specific things from transcript>],
  "weaknesses": [<specific gaps from transcript>],
  "recommendations": [<actionable items based on actual performance>],
  "star_analysis": {{
    "uses_star": <true/false based on transcript>,
    "notes": "<specific note about STAR usage>"
  }},
  "final_verdict": "<based on overall_score>"
}}
"""


# -------------------- OpenRouter Call --------------------
def _call_openrouter_and_parse(prompt: str, max_retries: int = 2) -> Optional[Dict[str, Any]]:
    attempt = 0
    while attempt <= max_retries:
        try:
            response = client.chat.completions.create(
                model="meta-llama/llama-3-8b-instruct",
                messages=[
                    {"role": "system", "content": "You must return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
                max_tokens=900
            )

            text = response.choices[0].message.content.strip()

            print("\n===== RAW AI OUTPUT =====\n", text, "\n========================\n")

            try:
                return json.loads(text)
            except Exception:
                pass

            extracted = extract_first_json(text) or extract_json_via_regex(text)
            if extracted:
                try:
                    return json.loads(extracted)
                except Exception:
                    pass

            attempt += 1
            time.sleep(0.5 + attempt * 0.5)

        except Exception as e:
            print(f"OpenRouter Error (attempt {attempt}):", e)
            attempt += 1
            time.sleep(0.5 + attempt * 0.5)

    return None


# -------------------- Main Feedback Function --------------------
def generate_interview_feedback(
    transcript: List[Dict[str, Any]],
    jobField: str,
    behavioralMetrics: List[Dict[str, Any]],
    duration_ms: int,
    max_retries: int = 2
) -> str:

    user_turns = [t for t in transcript if t.get("speaker") == "user" and t.get("text")]
    if not user_turns:
        return json.dumps({
            "overall_score": 40,
            "job_match_score": 35,
            "communication_score": 20,
            "behavior_score": 50,
            "strengths": ["Interview session started successfully."],
            "weaknesses": ["No user responses detected."],
            "recommendations": ["Ensure microphone is working and answer aloud."],
            "star_analysis": {"uses_star": False, "notes": "No responses."},
            "final_verdict": "Not Ready"
        }, ensure_ascii=False)

    eye = clamp(safe_avg([m.get("eyeContactScore") for m in behavioralMetrics]))
    head = clamp(safe_avg([m.get("headMovementScore") for m in behavioralMetrics]))
    pace_raw = safe_avg([m.get("speakingPace") for m in behavioralMetrics], 120.0)
    pace_score = clamp(90 if 100 <= pace_raw <= 160 else max(0, 100 - abs(pace_raw - 130) * 0.8))
    confidence = clamp(safe_avg([m.get("confidenceScore") for m in behavioralMetrics]))

    # Calculate interview statistics for better analysis
    user_responses = [t.get("text", "") for t in user_turns]
    user_response_count = len(user_responses)
    total_words = sum(len(text.split()) for text in user_responses)
    avg_response_length = int(total_words / user_response_count) if user_response_count > 0 else 0
    
    # Calculate response quality indicators
    response_quality_score = 0
    if user_response_count > 0:
        # Longer responses generally indicate better engagement
        if avg_response_length >= 50:
            response_quality_score = 85
        elif avg_response_length >= 30:
            response_quality_score = 70
        elif avg_response_length >= 15:
            response_quality_score = 55
        else:
            response_quality_score = 40
    
    transcript_text = "\n".join(f"{t['speaker']}: {t['text']}" for t in transcript)[-40000:]

    prompt = make_prompt(jobField, transcript_text, eye, head, pace_score, confidence, 
                         duration_ms, user_response_count, avg_response_length)

    parsed = _call_openrouter_and_parse(prompt, max_retries)
    if parsed:
        # Calculate behavior score from metrics
        calculated_behavior_score = (eye + head + pace_score + confidence) / 4
        
        # Validate and clamp scores with intelligent fallbacks
        for k in ["overall_score", "job_match_score", "communication_score", "behavior_score"]:
            score = parsed.get(k, 0)
            
            # If score is 0 or invalid, calculate intelligent fallback
            if score == 0 or not isinstance(score, (int, float)) or score < 0:
                if k == "behavior_score":
                    parsed[k] = int(clamp(calculated_behavior_score))
                elif k == "job_match_score":
                    # Base on response quality and length
                    base_score = response_quality_score * 0.7
                    parsed[k] = int(clamp(base_score))
                elif k == "communication_score":
                    # Based on pace, confidence, and response quality
                    comm_base = (pace_score + confidence) / 2
                    if avg_response_length < 15:
                        comm_base -= 15  # Penalize very short responses
                    parsed[k] = int(clamp(comm_base))
                elif k == "overall_score":
                    # Weighted average
                    job = parsed.get("job_match_score", response_quality_score * 0.7)
                    comm = parsed.get("communication_score", (pace_score + confidence) / 2)
                    beh = calculated_behavior_score
                    parsed[k] = int(clamp((job * 0.4 + comm * 0.3 + beh * 0.3)))
            else:
                parsed[k] = int(clamp(score))
        
        # Ensure behavior_score matches calculated value (most reliable)
        parsed["behavior_score"] = int(clamp(calculated_behavior_score))
        
        # Enhance recommendations and feedback based on actual interview data
        if not parsed.get("strengths") or len(parsed.get("strengths", [])) == 0:
            strengths = []
            if user_response_count > 0:
                strengths.append(f"Provided {user_response_count} response(s)")
            if avg_response_length >= 30:
                strengths.append("Gave detailed responses")
            elif avg_response_length >= 15:
                strengths.append("Engaged with questions")
            if calculated_behavior_score >= 70:
                strengths.append("Good behavioral metrics")
            parsed["strengths"] = strengths if strengths else ["Participated in interview"]
        
        if not parsed.get("weaknesses") or len(parsed.get("weaknesses", [])) == 0:
            weaknesses = []
            if avg_response_length < 15:
                weaknesses.append(f"Responses were too brief (average {avg_response_length} words)")
            if user_response_count < 3:
                weaknesses.append("Limited number of responses provided")
            if calculated_behavior_score < 60:
                weaknesses.append("Behavioral metrics indicate room for improvement")
            parsed["weaknesses"] = weaknesses if weaknesses else ["Could improve response detail"]
        
        if not parsed.get("recommendations") or len(parsed.get("recommendations", [])) == 0:
            recommendations = []
            if avg_response_length < 20:
                recommendations.append(f"Expand responses - current average is only {avg_response_length} words. Aim for 30-50 words per answer.")
            if user_response_count < 3:
                recommendations.append("Provide more complete answers to all questions")
            recommendations.append(f"Practice answering {jobField} interview questions with specific examples")
            if calculated_behavior_score < 70:
                recommendations.append("Work on maintaining eye contact and confident speaking pace")
            parsed["recommendations"] = recommendations
        
        parsed.setdefault("star_analysis", {"uses_star": False, "notes": "No STAR method detected in responses"})
        
        # Calculate final verdict based on overall score
        overall = parsed.get("overall_score", 0)
        if overall >= 80:
            parsed["final_verdict"] = "Excellent"
        elif overall >= 60:
            parsed["final_verdict"] = "Good"
        elif overall >= 40:
            parsed["final_verdict"] = "Needs Improvement"
        else:
            parsed["final_verdict"] = "Not Ready"
        
        return json.dumps(parsed, ensure_ascii=False)

    # Enhanced fallback with better scoring based on actual interview data
    avg_behavior = (eye + head + pace_score + confidence) / 4
    
    # Calculate statistics for fallback
    user_responses = [t.get("text", "") for t in user_turns]
    user_response_count = len(user_responses)
    total_words = sum(len(text.split()) for text in user_responses)
    avg_response_length = int(total_words / user_response_count) if user_response_count > 0 else 0
    
    # Calculate scores based on actual performance
    response_quality = min(20, (avg_response_length / 2))  # Up to 20 points for response length
    response_count_bonus = min(10, user_response_count * 2)  # Up to 10 points for multiple responses
    
    job_match = int(clamp(50 + response_quality + response_count_bonus))
    comm_score = int(clamp((confidence + pace_score) / 2 + response_quality))
    overall = int(clamp((job_match + comm_score + avg_behavior) / 3))
    
    # Generate specific recommendations based on actual data
    recommendations = []
    if avg_response_length < 20:
        recommendations.append(f"Expand your responses - current average is only {avg_response_length} words. Provide more detail.")
    if user_response_count < 3:
        recommendations.append("Answer all questions completely to get better feedback")
    recommendations.append(f"Practice {jobField} interview questions with specific examples from your experience")
    if avg_behavior < 70:
        recommendations.append("Work on maintaining eye contact and speaking at a confident pace")
    
    strengths = []
    if user_response_count > 0:
        strengths.append(f"Completed interview with {user_response_count} response(s)")
    if avg_response_length >= 20:
        strengths.append("Provided reasonably detailed answers")
    if avg_behavior >= 70:
        strengths.append("Good behavioral metrics during interview")
    
    weaknesses = []
    if avg_response_length < 20:
        weaknesses.append(f"Responses were too brief (average {avg_response_length} words)")
    if avg_behavior < 60:
        weaknesses.append("Behavioral metrics indicate areas for improvement")
    
    return json.dumps({
        "overall_score": overall,
        "job_match_score": job_match,
        "communication_score": comm_score,
        "behavior_score": int(clamp(avg_behavior)),
        "strengths": strengths if strengths else ["Completed interview session"],
        "weaknesses": weaknesses if weaknesses else ["AI analysis unavailable - using fallback metrics"],
        "recommendations": recommendations,
        "star_analysis": {"uses_star": False, "notes": "AI unavailable for detailed STAR analysis."},
        "final_verdict": "Excellent" if overall >= 80 else "Good" if overall >= 60 else "Needs Improvement"
    }, ensure_ascii=False)
