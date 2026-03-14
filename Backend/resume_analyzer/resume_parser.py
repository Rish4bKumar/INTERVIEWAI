# import requests
# import json

# RAPID_API_KEY = "cf3cde0602msh9043cacbeec6914p1fa109jsndb18e1614bb8"

# API_URL = "https://resume-parsing-api2.p.rapidapi.com/processDocument"
# API_HOST = "resume-parsing-api2.p.rapidapi.com"


# def parse_resume_with_rapidapi(file_bytes: bytes, filename: str):
#     headers = {
#         "X-RapidAPI-Key": RAPID_API_KEY,
#         "X-RapidAPI-Host": API_HOST
#     }

#     # Detect MIME type
#     if filename.lower().endswith(".pdf"):
#         mime_type = "application/pdf"
#     else:
#         mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

#     files = {
#         "file": (filename, file_bytes, mime_type)
#     }

#     payload = {
#         "extractionDetails": {
#             "name": "Resume - Extraction",
#             "language": "English",
#             "fields": [
#                 {"key": "personal_info"},
#                 {"key": "education"},
#                 {"key": "experience"},
#                 {"key": "skills"},
#                 {"key": "projects"}
#             ]
#         }
#     }

#     # payload must be JSON string in form-data
#     data = {"payload": json.dumps(payload)}

#     response = requests.post(API_URL, headers=headers, files=files, data=data)

#     print("🔍 RAW API RESPONSE:", response.text)   # <-- important debug

#     try:
#         return response.json()
#     except:
#         return {
#             "error": "Invalid JSON received",
#             "raw": response.text
#         }
