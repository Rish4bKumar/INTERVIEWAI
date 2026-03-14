import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Load OpenRouter API Key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY not found in .env")

# Create OpenRouter client (OpenAI-compatible)
client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)


def generate_ai_suggestions(resume_text: str, profession: str, missing_skills):
    """
    Generates ATS-friendly resume improvement suggestions in Markdown format.
    """

    if isinstance(missing_skills, list):
        skills_str = ", ".join(missing_skills) if missing_skills else "None"
    else:
        skills_str = str(missing_skills) if missing_skills else "None"

    prompt = f"""
You are an expert ATS Resume Optimization Assistant and Career Coach.

**TARGET JOB ROLE:** {profession}
**MISSING SKILLS:** {skills_str}

**RESUME CONTENT:**
{resume_text[:3000]}

**TASK:** Provide a comprehensive resume evaluation in the following EXACT format:

## 📊 Overall Assessment
[Give a clear verdict: "Excellent", "Good", "Needs Improvement", or "Poor" - with 1-2 sentences explaining why]

## ✅ Strengths
- [List 3-5 specific strengths of this resume]
- [Be specific about what's working well]

## ⚠️ Areas of Concern
- [List 3-5 specific weaknesses or gaps]
- [Focus on missing skills, weak sections, or ATS issues]

## 🎯 Critical Improvements Needed
1. **[Priority 1]** - [Specific actionable improvement]
2. **[Priority 2]** - [Specific actionable improvement]
3. **[Priority 3]** - [Specific actionable improvement]
4. **[Priority 4]** - [Specific actionable improvement]
5. **[Priority 5]** - [Specific actionable improvement]

## 📝 Missing Keywords to Add
[Comma-separated list of important keywords for {profession}]

## 💡 Quick Wins
- [2-3 easy improvements that can be done immediately]
- [Focus on formatting, structure, or simple additions]

## 📋 Recommended Professional Summary
[Write a 2-3 sentence ATS-optimized professional summary for this candidate]

**IMPORTANT:** Be honest, constructive, and specific. Focus on actionable advice that will improve ATS compatibility and job match.
"""

    try:
        response = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=700
        )

        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("Empty response from OpenRouter")

        return content.strip()

    except Exception as e:
        print("OpenRouter Error:", e)
        return f"""**AI suggestions unavailable**

**Manual tips:**
- Add missing skills: {skills_str}
- Match job description keywords
- Use measurable achievements
- Keep resume ATS-friendly
"""
