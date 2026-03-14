import pdfplumber
import docx


def extract_text_from_file(filepath: str) -> str:
    if filepath.lower().endswith(".pdf"):
        return extract_pdf(filepath)
    elif filepath.lower().endswith(".docx"):
        return extract_docx(filepath)
    else:
        return ""


def extract_pdf(path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
    except Exception as e:
        print("PDF extraction error:", e)
    return text


def extract_docx(path: str) -> str:
    text = ""
    try:
        doc = docx.Document(path)
        text = "\n".join(para.text for para in doc.paragraphs)
    except Exception as e:
        print("DOCX extraction error:", e)
    return text
