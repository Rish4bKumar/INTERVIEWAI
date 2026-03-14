import spacy
import json
import re
from nltk.corpus import stopwords

nlp = spacy.load("en_core_web_sm")
STOPWORDS = set(stopwords.words("english"))

skills_list = json.load(open("resume_analyzer/skills_db.json", encoding="utf-8"))


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9 \n\.]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text


def extract_skills(cleaned_text: str):
    found = []
    for skill in skills_list:
        if skill.lower() in cleaned_text:
            found.append(skill.lower())
    return sorted(list(set(found)))


def extract_experience(text: str):
    # e.g. "3 years", "2+ yrs"
    patterns = r'(\d+)\+?\s+(years?|yrs?)'
    matches = re.findall(patterns, text.lower())
    return [m[0] + " years" for m in matches]


def extract_education(text: str):
    education_keywords = [
        "btech", "b.e", "b.e.", "bachelor", "masters", "mtech", "mca",
        "bca", "bsc", "msc", "mba", "phd", "diploma"
    ]
    text_lower = text.lower()
    found = [e for e in education_keywords if e in text_lower]
    return list(set(found))


def process_resume_text(text: str):
    cleaned = clean_text(text)
    skills = extract_skills(cleaned)
    experience = extract_experience(text)
    education = extract_education(text)

    return {
        "skills": skills,
        "experience": experience,
        "education": education
    }
