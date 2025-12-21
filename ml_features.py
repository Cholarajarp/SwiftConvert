"""ML feature utilities: OCR, classification, translation, and analytics helpers.

This module contains lightweight, optional ML helpers used by the Flask app.
Some sections intentionally catch broad exceptions and use dynamic libraries
(like OpenCV/EasyOCR), so a few pylint pragmas are enabled for clarity.
"""

# Pylint: CV libraries use dynamic attributes; allow module-wide exceptions where needed
# pylint: disable=broad-except,no-member,invalid-name

import os
import json
import logging
from pathlib import Path

import cv2
import pandas as pd
import easyocr
import pytesseract
from langdetect import detect_langs
from deep_translator import GoogleTranslator
import torch

logger = logging.getLogger(__name__)

# Initialize models (lazy loading)
_ocr_reader = None  # pylint: disable=invalid-name

# ============================================
# 1. OCR - Computer Vision + NLP
# ============================================


def get_ocr_reader():
    """Lazy load EasyOCR reader"""
    global _ocr_reader
    if _ocr_reader is None:
        try:
            logger.info(
                "Initializing EasyOCR with English, Hindi, Kannada support...")
            _ocr_reader = easyocr.Reader(
                ['en', 'kn'], gpu=torch.cuda.is_available())
            logger.info("EasyOCR initialized successfully")
        except Exception as e:
            logger.error("EasyOCR initialization error: %s", e)
            # Fallback to English only
            _ocr_reader = easyocr.Reader(['en'], gpu=False)
    return _ocr_reader


def _prepare_image_for_ocr(image_path):
    """Load an image and prepare grayscale + thresholded version for Tesseract."""
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 11, 2)
    return img, thresh


def _run_easyocr(image_path):
    reader = get_ocr_reader()
    logger.info("Running EasyOCR readtext...")
    results = reader.readtext(str(image_path), detail=1)

    text_blocks = []
    full_text = []
    total_confidence = 0.0

    logger.info("EasyOCR found %d text regions", len(results))

    for (bbox, text, conf) in results:
        text_blocks.append({
            'text': text,
            'confidence': float(conf),
            'bbox': [[int(x), int(y)] for x, y in bbox]
        })
        full_text.append(text)
        total_confidence += float(conf)

    avg_confidence = total_confidence / len(results) if results else 0.0
    combined_text = ' '.join(full_text)
    return combined_text, text_blocks, avg_confidence


def _run_tesseract(thresh):
    custom_config = r'--oem 3 --psm 6'
    text = pytesseract.image_to_string(thresh, config=custom_config)
    data = pytesseract.image_to_data(
        thresh, output_type=pytesseract.Output.DICT)

    confidences = [int(conf) for conf in data.get('conf', []) if conf != '-1']
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    avg_confidence = avg_confidence / 100  # Normalize to 0-1
    text_blocks = [{'text': text, 'confidence': avg_confidence}]
    return text, text_blocks, avg_confidence


def extract_text_ocr(image_path, engine='easyocr'):
    """Extract text from image using OCR. Delegates to small helpers for readability."""
    try:
        logger.info("Starting OCR on %s with engine=%s", image_path, engine)

        if engine == 'easyocr':
            combined_text, text_blocks, avg_confidence = _run_easyocr(
                image_path)
        else:
            # Prepare image for tesseract and run
            _, thresh = _prepare_image_for_ocr(image_path)
            combined_text, text_blocks, avg_confidence = _run_tesseract(thresh)

        # Detect language
        try:
            if combined_text.strip():
                lang_result = detect_language_advanced(combined_text)
                detected_lang = lang_result.get('primary_language', 'unknown')
                lang_confidence = lang_result.get('confidence', 0)
            else:
                detected_lang = 'unknown'
                lang_confidence = 0
        except Exception as e:
            logger.warning("Language detection failed: %s", e)
            detected_lang = 'unknown'
            lang_confidence = 0

        result = {
            'text': combined_text,
            'blocks': text_blocks,
            'confidence': round(avg_confidence, 3),
            'language': detected_lang,
            'language_confidence': round(lang_confidence, 3),
            'word_count': len(combined_text.split()) if combined_text else 0,
            'engine': engine
        }

        logger.info(
            "OCR complete: %d chars, confidence=%.2f",
            len(combined_text),
            avg_confidence)
        return result

    except Exception as e:
        logger.error("OCR error: %s", e, exc_info=True)
        return {
            'text': '',
            'confidence': 0,
            'language': 'unknown',
            'word_count': 0,
            'error': str(e)
        }

# ============================================
# 2. Document Classification - NLP
# ============================================


class DocumentClassifier:
    """Classify documents into categories using a small keyword-based approach."""

    CATEGORIES = {
        'invoice': ['invoice', 'bill', 'receipt', 'payment', 'total', 'tax', 'gst', 'amount due'],
        'resume': ['experience', 'education', 'skills', 'objective', 'projects', 'certification'],
        'research': ['abstract', 'introduction', 'methodology', 'results', 'conclusion', 'references'],
        'legal': ['agreement', 'contract', 'whereas', 'party', 'terms', 'conditions', 'clause'],
        'report': ['executive summary', 'analysis', 'findings', 'recommendations', 'appendix'],
        'letter': ['dear', 'sincerely', 'regards', 'yours truly', 'subject', 'date']
    }

    def __init__(self):
        # Keyword-based classifier; no external model required for now
        self.model = None

    def _compute_keyword_scores(self, text_lower: str) -> dict:
        scores = {
            category: sum(
                1 for kw in keywords if kw in text_lower) for category,
            keywords in self.CATEGORIES.items()}
        total = sum(scores.values())
        if total > 0:
            normalized = {k: round(v / total, 3) for k, v in scores.items()}
        else:
            normalized = {k: 0.0 for k in scores.keys()}
        return normalized

    def classify(self, text):
        """Classify document based on content
        Returns: category, confidence scores
        """
        if not text or len(text.strip()) < 20:
            return {'category': 'unknown', 'confidence': 0, 'scores': {}}

        normalized_scores = self._compute_keyword_scores(text.lower())
        best_category = max(normalized_scores.items(), key=lambda x: x[1])[
            0] if normalized_scores else 'general'
        confidence = normalized_scores.get(best_category, 0.0)
        if confidence < 0.2:
            best_category = 'general'

        return {
            'category': best_category,
            'confidence': confidence,
            'scores': normalized_scores,
            'method': 'keyword-based'
        }

# ============================================
# 3. Smart Format Recommendation
# ============================================


def _recommend_for_image(file_path, content_analysis):
    recommendations = []
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > 5:
        recommendations.append({
            'format': 'pdf',
            'reason': 'Large image - PDF provides better compression',
            'confidence': 0.9
        })
    if content_analysis and content_analysis.get('has_text'):
        recommendations.append({
            'format': 'docx',
            'reason': 'Image contains text - DOCX preserves editability',
            'confidence': 0.7
        })
    return recommendations


def _recommend_for_pdf(file_path, content_analysis):
    recommendations = []
    if content_analysis and content_analysis.get('category') == 'resume':
        recommendations.append({
            'format': 'docx',
            'reason': 'Resume detected - DOCX allows easy editing',
            'confidence': 0.85
        })
    elif content_analysis and content_analysis.get('page_count', 0) > 50:
        recommendations.append({
            'format': 'txt',
            'reason': 'Large document - TXT for quick access',
            'confidence': 0.6
        })
    return recommendations


def _recommend_for_spreadsheet(file_path, content_analysis):
    return [{
        'format': 'pdf',
        'reason': 'Spreadsheet - PDF for presentation',
        'confidence': 0.8
    }]


def recommend_output_format(file_path, file_type, content_analysis=None):
    """
    Recommend best output format based on file analysis
    """
    ft = (file_type or '').lower()
    content_analysis = content_analysis or {}

    if ft in ['jpg', 'jpeg', 'png']:
        recommendations = _recommend_for_image(file_path, content_analysis)
    elif ft == 'pdf':
        recommendations = _recommend_for_pdf(file_path, content_analysis)
    elif ft in ['csv', 'xlsx']:
        recommendations = _recommend_for_spreadsheet(
            file_path, content_analysis)
    else:
        recommendations = []

    if not recommendations:
        recommendations.append({
            'format': 'pdf',
            'reason': 'PDF is universal and widely compatible',
            'confidence': 0.5
        })
    return sorted(recommendations, key=lambda x: x['confidence'], reverse=True)

# ============================================
# 4. Quality Scoring - Regression
# ============================================


def calculate_quality_score(input_file, output_file, conversion_type):
    """
    Predict conversion quality score (0-100)
    """
    try:
        input_size = os.path.getsize(input_file)
        output_size = os.path.getsize(output_file)

        # Basic metrics
        size_ratio = output_size / input_size if input_size > 0 else 0

        # Quality factors
        score = 70  # Base score

        # Size analysis
        if 0.8 < size_ratio < 1.5:
            score += 15  # Good size ratio
        elif size_ratio > 3:
            score -= 20  # Possibly bloated

        # Format-specific adjustments
        if conversion_type == 'pdf_to_docx':
            score += 10  # pdf2docx is reliable
        elif conversion_type == 'image_to_pdf':
            score += 5

        # File size penalties
        if output_size < 1000:  # Too small, might be empty
            score -= 30

        # OCR confidence (if applicable)
        # This would be populated from actual OCR results

        score = max(0, min(100, score))  # Clamp between 0-100

        return {
            'quality_score': round(score, 1),
            'confidence': 0.75,
            'metrics': {
                'size_ratio': round(size_ratio, 2),
                'input_size_mb': round(input_size / (1024 * 1024), 2),
                'output_size_mb': round(output_size / (1024 * 1024), 2)
            },
            'recommendation': 'Good quality' if score > 70 else 'Acceptable' if score > 50 else 'Review needed'
        }

    except Exception as e:
        logger.error("Quality scoring error: %s", e)
        return {'quality_score': 0, 'error': str(e)}

# ============================================
# 5. Language Detection + Translation
# ============================================


def detect_language_advanced(text):
    """
    Detect language with confidence scores
    """
    try:
        if not text or len(text.strip()) < 10:
            return {'language': 'unknown', 'confidence': 0}

        # Get multiple language predictions
        langs = detect_langs(text)

        results = []
        for lang in langs:
            results.append({
                'language': lang.lang,
                'confidence': round(lang.prob, 3)
            })

        return {
            'primary_language': results[0]['language'] if results else 'unknown',
            'confidence': results[0]['confidence'] if results else 0,
            'all_languages': results}

    except Exception as e:
        logger.error("Language detection error: %s", e)
        return {'language': 'en', 'confidence': 0.5}


def translate_text(text, target_lang='en', source_lang='auto'):
    """
    Translate text to target language
    """
    try:
        if not text or len(text.strip()) < 2:
            return {
                'translated': text,
                'error': 'Text too short',
                'success': False}

        # Map language codes
        lang_map = {
            'kn': 'kn',  # Kannada
            'hi': 'hi',  # Hindi
            'ta': 'ta',  # Tamil
            'te': 'te',  # Telugu
            'en': 'en',  # English
            'es': 'es',  # Spanish
            'fr': 'fr'   # French
        }

        target = lang_map.get(target_lang.lower(), target_lang)

        logger.info("Translating to %s from %s", target, source_lang)
        translator = GoogleTranslator(source=source_lang, target=target)
        translated = translator.translate(text)

        logger.info("Translation successful: %d -> %d chars", len(text), len(translated))

        return {
            'original': text,
            'translated': translated,
            'source_language': source_lang,
            'target_language': target,
            'success': True
        }

    except Exception as e:
        logger.error("Translation error: %s", e)
        return {
            'error': str(e),
            'success': False
        }

# ============================================
# 6. Usage Analytics - ML Insights
# ============================================


class UsageAnalytics:
    """Track and analyze conversion patterns"""

    def __init__(self, db_path='analytics.json'):
        self.db_path = Path(db_path)
        self.data = self._load_data()

    def _load_data(self):
        """Load analytics data"""
        if self.db_path.exists():
            with open(self.db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'conversions': [], 'errors': [], 'user_behavior': []}

    def _save_data(self):
        """Save analytics data"""
        with open(self.db_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2)

    # pylint: disable=too-many-arguments
    def log_conversion(
            self,
            source_format,
            target_format,
            success,
            quality_score=None,
            duration=None):
        """Log conversion event"""
        event = {
            'timestamp': str(pd.Timestamp.now()),
            'source': source_format,
            'target': target_format,
            'success': success,
            'quality_score': quality_score,
            'duration_seconds': duration
        }
        self.data['conversions'].append(event)
        self._save_data()

    # pylint: disable=too-many-arguments
    def log_error(
            self,
            error_type,
            source_format,
            target_format,
            error_message):
        """Log error event"""
        event = {
            'timestamp': str(pd.Timestamp.now()),
            'error_type': error_type,
            'source': source_format,
            'target': target_format,
            'message': error_message
        }
        self.data['errors'].append(event)
        self._save_data()

    def get_insights(self):
        """Generate ML insights from usage data"""
        if not self.data['conversions']:
            return {'message': 'Not enough data for insights'}

        df = pd.DataFrame(self.data['conversions'])

        insights = {
            'total_conversions': len(df),
            'success_rate': round(df['success'].mean() * 100, 2),
            'popular_conversions': df.groupby(['source', 'target']).size().nlargest(5).to_dict(),
            'average_quality': round(df['quality_score'].mean(), 2) if 'quality_score' in df else None,
            'failure_patterns': self._analyze_failures()
        }

        return insights

    def _analyze_failures(self):
        """Analyze common failure patterns"""
        if not self.data['errors']:
            return []

        error_df = pd.DataFrame(self.data['errors'])
        common_errors = error_df.groupby(
            ['source', 'target', 'error_type']).size().nlargest(3)

        results = []
        for idx, count in common_errors.items():
            # idx is a tuple (source, target, error_type)
            try:
                src, tgt, err = idx
            except Exception:
                # Fallback if grouping index has a different shape
                logger.warning("Unexpected grouping index shape: %s", idx)
                src, tgt, err = ('unknown', 'unknown', str(idx))
            results.append({'conversion': f"{src} → {tgt}",
                           'error': str(err), 'count': int(count)})
        return results


doc_classifier = DocumentClassifier()
analytics = UsageAnalytics()
