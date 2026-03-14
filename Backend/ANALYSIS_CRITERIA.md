# Resume Analysis Criteria

This document explains the basis and methodology used to analyze uploaded resumes.

## Overview

The resume analyzer evaluates resumes based on **ATS (Applicant Tracking System) compatibility** standards. ATS systems are used by most companies to filter and rank resumes before human review.

## Analysis Components

### 1. Keyword Optimization (40 points)

**Purpose**: Matches your resume against industry-relevant keywords that employers and ATS systems look for.

**How it works**:
- The system checks for specific technical keywords relevant to the target job role
- Each matched keyword contributes to your score
- Missing keywords are suggested for improvement

**Current Target Keywords** (for Developer role):
- Python, Flask, React, TypeScript, SQL, Git

**Scoring**:
- Full match: Full points per keyword
- Partial match: Half points
- Missing: Suggested for addition

### 2. Structural Completeness (30 points)

**Purpose**: Ensures your resume has all essential sections that ATS systems expect.

**Sections Checked**:
- **Skills Section** (10 points): Dedicated section listing technical and soft skills
- **Experience Section** (10 points): Work history, employment, or professional experience
- **Education Section** (5 points): Academic qualifications and certifications
- **Contact Information** (5 points): Email, phone, or other contact details

**Why it matters**: ATS systems parse resumes by section. Missing sections can cause your resume to be improperly categorized or rejected.

### 3. Content Quality (20 points)

**Purpose**: Evaluates the depth, clarity, and impact of your resume content.

**Factors Evaluated**:

1. **Length** (10 points):
   - Ideal: 200-800 words (1-2 pages)
   - Too short: Missing detail and impact
   - Too long: May be filtered out or lose reader attention

2. **Action Verbs** (5 points):
   - Strong action verbs (e.g., "developed", "created", "implemented") show impact
   - Demonstrates proactive contributions
   - Makes achievements stand out

3. **Quantifiable Achievements** (5 points):
   - Numbers, percentages, and metrics (e.g., "increased sales by 30%")
   - Shows measurable impact
   - More credible and impressive to employers

### 4. ATS Compatibility (10 points)

**Purpose**: Ensures your resume can be properly parsed by automated systems.

**Checks Performed**:
- Text-based format (not image-based PDFs)
- Standard section headers
- Proper formatting that ATS can read

**Common Issues**:
- Images embedded in resume (ATS cannot read text from images)
- Non-standard section names
- Complex formatting that breaks parsing

## Scoring System

**Total Possible Score**: 100 points

- **80-100**: Excellent - Strong ATS compatibility
- **60-79**: Good - Solid foundation with room for improvement
- **40-59**: Fair - Needs significant improvements
- **0-39**: Poor - Major issues that need addressing

## How to Improve Your Score

1. **Add Missing Keywords**: Include all suggested keywords naturally in your resume
2. **Complete All Sections**: Ensure Skills, Experience, Education, and Contact sections are present
3. **Use Action Verbs**: Start bullet points with strong action verbs
4. **Add Metrics**: Include numbers, percentages, and quantifiable results
5. **Optimize Length**: Aim for 1-2 pages (200-800 words)
6. **Use Standard Formatting**: Avoid images, use standard section headers

## Technical Details

- **Supported Formats**: PDF and DOCX
- **Text Extraction**: Uses pdfminer.six for PDFs and python-docx for DOCX files
- **NLP Processing**: Uses spaCy for advanced text analysis (if available)
- **Keyword Matching**: Case-insensitive matching with partial match support

## Future Enhancements

- Custom job description matching
- Industry-specific keyword sets
- Advanced NLP-based content analysis
- Resume template recommendations
- Real-time feedback during editing

