from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_feedback import generate_interview_feedback

from werkzeug.utils import secure_filename
import os
import json 
from resume_analyzer.extractor import extract_text_from_file
from resume_analyzer.nlp_processor import process_resume_text
from resume_analyzer.scorer import profession_based_score
from resume_analyzer.ai_suggester import generate_ai_suggestions
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# OpenRouter client for interview questions
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if OPENROUTER_API_KEY:
    openrouter_client = OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1"
    )
else:
    openrouter_client = None

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'temp_uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {"pdf", "docx"}


# ----------------------------
# UTILITY
# ----------------------------

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ----------------------------
# HEALTH CHECK
# ----------------------------

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})


# ----------------------------
# INTERVIEW AI FEEDBACK
# ----------------------------

@app.route("/ai-feedback", methods=["POST"])
def ai_feedback_route():
    data = request.json
    transcript = data.get("transcript", [])
    jobField = data.get("jobField", "Software Engineer")
    behavioral = data.get("behavioralMetrics", [])
    duration = data.get("duration", 0)

    feedback = generate_interview_feedback(transcript, jobField, behavioral, duration)

    return jsonify({"feedback": json.loads(feedback)})


# ----------------------------
# RESUME ANALYZER
# ----------------------------

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    # 1) Profession
    profession = request.form.get("profession")
    if not profession:
        return jsonify({"error": "Profession is required"}), 400

    # 2) File upload validation
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    resume_file = request.files['file']
    if resume_file.filename == "":
        return jsonify({"error": "Empty file name"}), 400

    if not allowed_file(resume_file.filename):
        return jsonify({"error": "Only PDF and DOCX are allowed"}), 400

    # 3) Save file
    filename = secure_filename(resume_file.filename)
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    resume_file.save(filepath)

    # 4) Extract text
    extracted_text = extract_text_from_file(filepath)
    if not extracted_text.strip():
        return jsonify({"error": "Could not extract text from resume"}), 500

    # 5) NLP processing
    nlp_results = process_resume_text(extracted_text)

    # 6) Profession-based ATS scoring
    ats_results = profession_based_score(
        resume_skills=nlp_results["skills"],
        profession=profession
    )

    # 7) AI suggestions
    suggestions = generate_ai_suggestions(
        resume_text=extracted_text,
        profession=profession,
        missing_skills=ats_results["missing"]
    )

    return jsonify({
        "profession": profession,
        "extracted_text": extracted_text,
        "skills_found": nlp_results["skills"],
        "experience": nlp_results["experience"],
        "education": nlp_results["education"],
        "matched_skills": ats_results["matched"],
        "missing_skills": ats_results["missing"],
        "profession_ats_score": ats_results["score"],
        "suggestions": suggestions
    })


# ----------------------------
# ATTENTION SCORE (MEDIAPIPE)
# ----------------------------

# Stores per-frame attention scores
attention_scores = []


@app.route("/attention-score", methods=["POST"])
def receive_attention_score():
    data = request.json
    score = data.get("score")

    if score is None:
        return jsonify({"error": "Score is required"}), 400

    attention_scores.append(score)
    print("Received Attention Score:", score)

    return jsonify({"message": "Score received", "score": score})


@app.route("/attention-summary", methods=["GET"])
def attention_summary():
    """Return average score + all scores after interview ends."""
    if not attention_scores:
        return jsonify({"average": 0, "scores": []})

    avg_score = sum(attention_scores) / len(attention_scores)

    return jsonify({
        "average": round(avg_score, 2),
        "scores": attention_scores
    })


# ----------------------------
# INTERVIEW AI QUESTIONS (OpenRouter)
# ----------------------------

@app.route("/interview-question", methods=["POST"])
def get_interview_question():
    """Get next interview question using OpenRouter API."""
    if not openrouter_client:
        return jsonify({"error": "OpenRouter API key not configured"}), 500
    
    try:
        data = request.json
        messages = data.get("messages", [])
        job_field = data.get("jobField", "Software Engineer")
        
        # Add system message if not present
        has_system = any(msg.get("role") == "system" for msg in messages)
        if not has_system:
            system_message = {
                "role": "system",
                "content": f"""You are an experienced {job_field} interviewer conducting a professional job interview. 
Your role is to:
1. Ask relevant, thoughtful questions about the candidate's experience, skills, and fit for the role
2. Follow up on their answers with deeper questions
3. Keep questions concise (2-3 sentences max)
4. Be professional but friendly
5. Ask one question at a time
6. After 5-7 questions, wrap up the interview professionally

Start by greeting the candidate and asking your first question about their background."""
            }
            messages = [system_message] + messages
        
        response = openrouter_client.chat.completions.create(
            model="meta-llama/llama-3-8b-instruct",
            messages=messages,
            temperature=0.8,
            max_tokens=150
        )
        
        assistant_message = response.choices[0].message.content.strip()
        
        return jsonify({
            "message": assistant_message
        })
        
    except Exception as e:
        print(f"Error getting interview question: {e}")
        return jsonify({"error": str(e)}), 500


# ----------------------------
# RUN SERVER
# ----------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
