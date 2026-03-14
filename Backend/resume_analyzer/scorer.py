import json


def load_profession_skills(profession: str):
    data = json.load(open("resume_analyzer/profession_skills.json", encoding="utf-8"))
    prof_data = data.get(profession)
    if not prof_data:
        return [], "Unknown Profession"
    return prof_data.get("required_skills", []), prof_data.get("label", profession)


def profession_based_score(resume_skills, profession: str):
    required_skills, _ = load_profession_skills(profession)
    required_skills = [s.lower() for s in required_skills]

    resume_skills_set = set(s.lower() for s in resume_skills)

    matched = [s for s in required_skills if s in resume_skills_set]
    missing = [s for s in required_skills if s not in resume_skills_set]

    if len(required_skills) == 0:
        score = 0
    else:
        score = (len(matched) / len(required_skills)) * 100

    return {
        "score": round(score, 2),
        "matched": matched,
        "missing": missing
    }
