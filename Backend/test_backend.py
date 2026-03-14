"""
Simple test script to verify backend functionality.
Run this to test if the resume analyzer is working properly.
"""

import os
import sys

def test_imports():
    """Test if all required modules can be imported."""
    print("Testing imports...")
    try:
        from flask import Flask
        print("✓ Flask imported")
    except ImportError as e:
        print(f"✗ Flask import failed: {e}")
        return False
    
    try:
        from resume_analyzer.nlp_processor import process_resume_file, extract_text_from_file
        print("✓ Resume analyzer module imported")
    except ImportError as e:
        print(f"✗ Resume analyzer import failed: {e}")
        return False
    
    try:
        import nltk
        print("✓ NLTK imported")
    except ImportError as e:
        print(f"✗ NLTK import failed: {e}")
        return False
    
    try:
        from pdfminer.high_level import extract_text
        print("✓ pdfminer imported")
    except ImportError as e:
        print(f"✗ pdfminer import failed: {e}")
        return False
    
    try:
        from docx import Document
        print("✓ python-docx imported")
    except ImportError as e:
        print(f"✗ python-docx import failed: {e}")
        return False
    
    return True

def test_nltk_resources():
    """Test if NLTK resources are available."""
    print("\nTesting NLTK resources...")
    try:
        import nltk
        try:
            nltk.data.find("corpora/stopwords")
            print("✓ NLTK stopwords available")
        except LookupError:
            print("⚠ NLTK stopwords not found, will download on first use")
    except Exception as e:
        print(f"✗ NLTK resource check failed: {e}")
        return False
    return True

def test_spacy():
    """Test if spaCy model is available."""
    print("\nTesting spaCy...")
    try:
        import spacy
        try:
            nlp = spacy.load("en_core_web_sm")
            print("✓ spaCy model 'en_core_web_sm' loaded")
            return True
        except (IOError, OSError):
            print("⚠ spaCy model 'en_core_web_sm' not found")
            print("  Run: python -m spacy download en_core_web_sm")
            print("  (Analysis will work without it, but with reduced features)")
            return True  # Not critical
    except ImportError:
        print("⚠ spaCy not installed (optional)")
        return True  # Not critical
    except Exception as e:
        print(f"✗ spaCy check failed: {e}")
        return True  # Not critical

def test_file_extraction():
    """Test file extraction functions."""
    print("\nTesting file extraction...")
    from resume_analyzer.nlp_processor import extract_text_from_file
    
    # Test with a non-existent file
    result = extract_text_from_file("nonexistent.pdf")
    if result is None:
        print("✓ File extraction handles missing files correctly")
    else:
        print("⚠ File extraction returned unexpected result for missing file")
    
    return True

def main():
    print("=" * 60)
    print("Backend Resume Analyzer - Test Suite")
    print("=" * 60)
    
    all_passed = True
    
    # Test imports
    if not test_imports():
        print("\n❌ Import tests failed. Please install missing dependencies:")
        print("   pip install -r requirement.txt")
        all_passed = False
    
    # Test NLTK
    if not test_nltk_resources():
        all_passed = False
    
    # Test spaCy
    test_spacy()
    
    # Test file extraction
    if not test_file_extraction():
        all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ All critical tests passed!")
        print("\nTo start the backend server, run:")
        print("   python app.py")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
    print("=" * 60)

if __name__ == "__main__":
    main()

