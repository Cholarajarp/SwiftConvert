"""SwiftConvert backend Flask app.

Provides file conversion and OCR endpoints with pluggable ML features.
This module contains route handlers and light orchestration; heavy work is
delegated to `converters`, `ocr_utils` and `fs_utils` for better testability.

Note: many route handlers intentionally catch broad exceptions because they
wrap external libraries and should return HTTP 5xx for unexpected errors.
We therefore allow broad-except in this module to keep handler logic simple.
"""

# pylint: disable=broad-except

import os
import time
import logging
from pathlib import Path

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
from dotenv import load_dotenv
import stripe

# Externalized helpers (converters / ocr) and filesystem utilities
import converters
import ocr_utils
from fs_utils import safe_unlink, _save_uploaded_file, _check_file_size as fs_check_file_size, cleanup_old_files as fs_cleanup_old_files

# Load environment variables
load_dotenv()

NODE_ENV = os.environ.get('NODE_ENV', 'production')

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import ML features with fallback
ML_FEATURES_AVAILABLE = False
try:
    from ml_features import (
        extract_text_ocr,
        doc_classifier,
        recommend_output_format,
        calculate_quality_score,
        detect_language_advanced,
        translate_text,
        analytics
    )
    ML_FEATURES_AVAILABLE = True
    logger.info("✅ ML features loaded successfully")
except Exception as e:
    logger.warning("ML features not available (optional): %s", str(e)[:100])
    # Provide dummy implementations that match expected interfaces to satisfy
    # type-checkers

    def extract_text_ocr(*args, **kwargs):
        """Dummy OCR extractor when ML features aren't available."""
        return {
            "text": "",
            "confidence": 0.0,
            "language": "unknown",
            "word_count": 0,
            "blocks": []}

    class DummyDocClassifier:
        """Fallback document classifier used for development without ML."""

        def classify(self, text: str):
            """Return a default 'unknown' classification."""
            return {'category': 'unknown', 'confidence': 0, 'scores': {}}

    doc_classifier = DummyDocClassifier()

    def recommend_output_format(file_path, file_type, content_analysis=None):
        """Return a basic format recommendation when ML is not present."""
        return [{'format': 'pdf', 'reason': 'default', 'confidence': 0.5}]

    def calculate_quality_score(*args, **kwargs):
        """Return a default quality score."""
        return {
            'quality_score': 0.0,
            'confidence': 0.0,
            'metrics': {},
            'recommendation': 'N/A'}

    def detect_language_advanced(*args, **kwargs):
        """Return a default language detection payload."""
        return {
            'primary_language': 'unknown',
            'confidence': 0,
            'all_languages': []}

    def translate_text(*args, **kwargs):
        """Return a default translation payload."""
        return {
            'original': '',
            'translated': '',
            'source_language': 'unknown',
            'target_language': 'unknown',
            'success': False}

    class DummyAnalytics:
        """Lightweight analytics stand-in when analytics isn't available."""

        def __init__(self):
            self._data = {'conversions': [], 'errors': []}

        def log_conversion(self, *args, **kwargs):
            return None

        def log_error(self, *args, **kwargs):
            return None

        def get_insights(self):
            return {'message': 'Analytics not available'}

    analytics = DummyAnalytics()


# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
PORT = int(os.environ.get('PORT', 3001))
NODE_ENV = os.environ.get('NODE_ENV', 'development')
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / 'uploads'
OUTPUT_DIR = BASE_DIR / 'converted'
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

# Stripe Configuration
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_PUBLIC_KEY = os.environ.get('STRIPE_PUBLIC_KEY', '')
PRO_PLAN_PRICE_INR = int(os.environ.get('PRO_PLAN_PRICE_INR', 49))
PRO_PLAN_PRICE_USD = float(os.environ.get('PRO_PLAN_PRICE_USD', 9.99))

# Create directories
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Allowed formats
ALLOWED_EXTENSIONS = {
    'pdf', 'docx', 'doc', 'odt', 'rtf', 'txt', 'md', 'html',
    'xlsx', 'xls', 'ods', 'csv',
    'pptx', 'odp',
    'jpg', 'jpeg', 'png'
}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit(
        '.', 1)[1].lower() in ALLOWED_EXTENSIONS


def json_error_response(error_message, status_code=500):
    """Create standardized JSON error response"""
    logger.error(error_message)
    return jsonify({'error': str(error_message)}), status_code


def json_success_response(data, message='Success'):
    """Create standardized JSON success response"""
    return jsonify({'success': True, 'message': message, **data})


def cleanup_old_files():
    """Delegate to fs_utils.cleanup_old_files configured for project directories."""
    try:
        fs_cleanup_old_files(UPLOAD_DIR, OUTPUT_DIR)
    except Exception as e:
        logger.error("Cleanup error: %s", e)


def convert_file(input_path, output_path, source_ext, target_ext):
    """Delegate main conversion routing to `converters.convert_file` to reduce coupling in app.py."""
    return converters.convert_file(
        input_path, output_path, source_ext, target_ext)

# Routes


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'SwiftConvert Python Backend is running',
        'version': '2.0.0'
    })


@app.route('/api/formats', methods=['GET'])
def get_formats():
    """Get supported formats"""
    return jsonify({
        'formats': list(ALLOWED_EXTENSIONS)
    })


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get Stripe public key and pricing"""
    return jsonify({
        'stripePublicKey': STRIPE_PUBLIC_KEY,
        'pricing': {
            'pro': {
                'inr': PRO_PLAN_PRICE_INR,
                'usd': PRO_PLAN_PRICE_USD
            }
        }
    })


@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    """Create Stripe checkout session for Pro plan"""
    try:
        data = request.get_json()
        currency = data.get('currency', 'inr').lower()

        # Determine price based on currency
        if currency == 'inr':
            price_amount = PRO_PLAN_PRICE_INR * 100  # Stripe uses smallest currency unit
        else:
            price_amount = int(PRO_PLAN_PRICE_USD * 100)

        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': currency,
                    'unit_amount': price_amount,
                    'product_data': {
                        'name': 'SwiftConvert Pro Plan',
                        'description': 'Unlimited conversions, 200MB file size, high quality'
                    },
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.host_url + '?success=true',
            cancel_url=request.host_url + '?canceled=true',
        )

        return jsonify({
            'sessionId': checkout_session.id,
            'url': checkout_session.url
        })

    except Exception as e:
        logger.error("Stripe checkout error: %s", e)
        return jsonify({'error': str(e)}), 500


@app.route('/api/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        logger.error("Invalid payload: %s", e)
        return jsonify({'error': 'Invalid payload'}), 400
    except Exception as e:
        logger.error("Invalid signature: %s", e)
        return jsonify({'error': 'Invalid signature'}), 400

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        logger.info("Payment successful for session: %s", session.get('id'))
        # TODO: Grant Pro access to user

    return jsonify({'status': 'success'})

# Helper functions for convert endpoint


def _validate_conversion_request(file, to_format):
    """Validate file and format from request"""
    if not file or file.filename == '':
        raise ValueError('No file selected')
    if not to_format:
        raise ValueError('Target format not specified')
    if not allowed_file(file.filename):
        raise ValueError('Unsupported file format')


def _check_file_size(file_path):
    """Wrapper around fs_utils._check_file_size to use project MAX_FILE_SIZE."""
    return fs_check_file_size(file_path, MAX_FILE_SIZE)


def _ensure_supported_conversion(src: str, tgt: str):
    """Raise ValueError with a helpful message if conversion is unsupported."""
    s = (src or '').lower()
    t = (tgt or '').lower()
    # Allow common special cases
    if s == 'docx' and t == 'pdf':
        return
    if s == 'pdf' and t == 'docx':
        return
    allowed = SUPPORTED_CONVERSIONS.get(s, [])
    if t not in allowed:
        human_readable = ', '.join(sorted(set(allowed))) if allowed else 'None'
        raise ValueError(
            f'Conversion from {
                s.upper()} to {
                t.upper()} is not supported. Supported targets for {
                s.upper()}: {human_readable}')


def _perform_conversion(file: FileStorage, to_format: str):
    input_path, source_ext, input_filename = _save_uploaded_file(file)
    try:
        _check_file_size(input_path)
        _ensure_supported_conversion(source_ext, to_format)

        output_filename = f"{input_path.stem}.{to_format}"
        output_path = OUTPUT_DIR / output_filename

        logger.info("Starting conversion: %s -> %s", source_ext, to_format)
        convert_file(input_path, output_path, source_ext, to_format)

        cleanup_old_files()
        return output_filename
    finally:
        try:
            safe_unlink(input_path)
        except Exception:
            logger.debug("cleanup: failed to remove input file (ignored)")


# Supported conversion mappings (canonical)
SUPPORTED_CONVERSIONS = {
    # PDF -> DOCX (and DOCX -> PDF handled in convert_file)
    'pdf': ['docx'],
    'docx': ['pdf', 'txt'],    # DOCX -> PDF, DOCX -> TXT/DOCX
    'doc': ['pdf', 'docx'],    # DOC -> PDF, DOC -> DOCX
    'txt': ['pdf', 'docx'],    # TXT -> PDF, TXT -> DOCX
    'md': ['docx', 'pdf'],     # MD -> DOCX, MD -> PDF
    'jpg': ['pdf'],
    'jpeg': ['pdf'],
    'png': ['pdf'],            # Image -> PDF
    'csv': ['xlsx', 'pdf'],    # CSV -> XLSX, CSV -> PDF
    'xlsx': ['csv']            # XLSX -> CSV/XLS (we support CSV↔XLSX)
}


@app.route('/api/convert', methods=['POST'])
# pylint: disable=broad-except
def convert():
    """File conversion endpoint (enforces supported conversion mapping)"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        file = request.files['file']
        to_format = request.form.get('toFormat', '').lower()

        # Validate file and format
        _validate_conversion_request(file, to_format)

        # Delegate to helper
        output_filename = _perform_conversion(file, to_format)

        return jsonify({
            'success': True,
            'filename': output_filename,
            'downloadUrl': f'/api/download/{output_filename}'
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error("Conversion error: %s", e)
        # _perform_conversion handles cleanup, so nothing extra to do here
        return jsonify({'error': str(e)}), 500


# ============================================
# AI/ML Endpoints
# ============================================

def _validate_ocr_request():
    """Validate OCR request and return file and engine"""
    if 'file' not in request.files:
        return None, None, json_error_response('No file uploaded', 400)

    file = request.files['file']
    # Explicitly ensure this is a FileStorage for type-checkers
    if not isinstance(file, FileStorage):
        return None, None, json_error_response('Invalid file upload', 400)
    if not file or file.filename == '':
        return None, None, json_error_response('No file selected', 400)

    engine = request.form.get('engine', 'easyocr')
    return file, engine, None


def _classify_ocr_text(text):
    """Classify OCR extracted text"""
    if not text or len(text.strip()) < 10:
        return {'category': 'unknown', 'confidence': 0}
    try:
        return doc_classifier.classify(text)
    except Exception as e:
        logger.warning("Classification failed: %s", e)
        return {'category': 'unknown', 'confidence': 0}


def _perform_ocr(file: FileStorage, engine: str):
    """Perform OCR and classification, ensuring cleanup of the uploaded file."""
    input_path, source_ext, input_filename = _save_uploaded_file(file)
    try:
        logger.info("Performing OCR on %s using %s", input_filename, engine)
        ocr_result = extract_text_ocr(input_path, engine=engine)
        classification = _classify_ocr_text(ocr_result.get('text', ''))
        if not isinstance(ocr_result, dict):
            ocr_result = {
                'text': '',
                'confidence': 0.0,
                'language': 'unknown',
                'word_count': 0}
        return {'ocr_result': ocr_result, 'classification': classification}
    finally:
        try:
            safe_unlink(input_path)
        except Exception as cleanup_err:
            logger.warning("Failed to remove temp file: %s", cleanup_err)


@app.route('/api/ocr', methods=['POST'])
# pylint: disable=broad-except
def perform_ocr():
    """Extract text from image using OCR"""
    if not ML_FEATURES_AVAILABLE:
        return jsonify(
            {'error': 'ML features not available - requires Python 3.11 or older'}), 503
    try:
        file, engine, error_response = _validate_ocr_request()
        if error_response:
            return error_response
        assert isinstance(file, FileStorage)

        assert isinstance(engine, str)
        result = _perform_ocr(file, engine)
        return json_success_response(
            {**result['ocr_result'], 'classification': result['classification']}, 'OCR successful')
    except Exception as e:
        logger.error("OCR error: %s", e)
        return json_error_response(f"OCR error: {str(e)}")


@app.route('/api/classify-document', methods=['POST'])
def classify_document():
    """Classify document type (invoice, resume, research paper, etc.)"""
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return json_error_response('No text provided', 400)

        result = doc_classifier.classify(text)
        return json_success_response(result, 'Classification successful')

    except Exception as e:
        return json_error_response(f"Classification error: {str(e)}")


def _get_format_recommendation(file: FileStorage):
    """Save file, get good format recommendations, cleanup and return (source_ext, recommendations)"""
    input_path, source_ext, input_filename = _save_uploaded_file(file)
    try:
        recommendations = recommend_output_format(input_path, source_ext)
        return source_ext, recommendations
    finally:
        try:
            safe_unlink(input_path)
        except Exception:
            logger.warning(
                "Failed to cleanup temporary file for recommendation")


@app.route('/api/recommend-format', methods=['POST'])
def get_format_recommendation():
    """Get smart format recommendation based on file analysis"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        file = request.files['file']
        if not isinstance(file, FileStorage):
            return jsonify({'error': 'Invalid file upload'}), 400
        if not file or file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        source_ext, recommendations = _get_format_recommendation(file)
        return jsonify({
            'success': True,
            'source_format': source_ext,
            'recommendations': recommendations
        })

    except Exception as e:
        logger.error("Recommendation error: %s", e)
        return jsonify({'error': str(e)}), 500


@app.route('/api/quality-score', methods=['POST'])
def get_quality_score():
    """Get quality score for a conversion"""
    try:
        data = request.get_json()
        input_file = data.get('input_file')
        output_file = data.get('output_file')
        conversion_type = data.get('conversion_type')

        if not all([input_file, output_file, conversion_type]):
            return jsonify({'error': 'Missing required parameters'}), 400

        input_path = UPLOAD_DIR / input_file
        output_path = OUTPUT_DIR / output_file

        if not output_path.exists():
            return jsonify({'error': 'Output file not found'}), 404

        # Calculate quality score
        quality_data = calculate_quality_score(
            input_path, output_path, conversion_type)

        return jsonify({
            'success': True,
            **quality_data
        })

    except Exception as e:
        logger.error("Quality scoring error: %s", e)
        return jsonify({'error': str(e)}), 500


@app.route('/api/detect-language', methods=['POST'])
def detect_language():
    """Detect language from text"""
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return json_error_response('No text provided', 400)

        result = detect_language_advanced(text)
        return json_success_response(result, 'Language detected')

    except Exception as e:
        return json_error_response(f"Language detection error: {str(e)}")


def _translate_handler(payload: dict):
    """Perform translation logic for the payload and return result dict."""
    text = payload.get('text', '')
    target_lang = payload.get('target_language', 'en')
    source_lang = payload.get('source_language', 'auto')

    if not text:
        raise ValueError('No text provided')

    result = translate_text(text, target_lang, source_lang)
    return {'success': result.get('success', False), **result}


@app.route('/api/translate', methods=['POST'])
def translate():
    """Translate text to target language"""
    if not ML_FEATURES_AVAILABLE:
        return jsonify(
            {'error': 'ML features not available - requires Python 3.11 or older'}), 503

    try:
        payload = request.get_json() or {}
        result = _translate_handler(payload)
        return jsonify(result)

    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        logger.error("Translation error: %s", e)
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get usage analytics and ML insights"""
    if not ML_FEATURES_AVAILABLE:
        return jsonify(
            {'error': 'ML features not available - requires Python 3.11 or older'}), 503

    try:
        insights = analytics.get_insights()

        return jsonify({
            'success': True,
            'insights': insights
        })

    except Exception as e:
        logger.error("Analytics error: %s", e)
        return jsonify({'error': str(e)}), 500


def _create_document_from_text(text, output_path, format_type):
    """Delegate to `ocr_utils._create_document_from_text`"""
    return ocr_utils._create_document_from_text(text, output_path, format_type)


def _translate_if_needed(
        text: str,
        enable_translation: bool,
        target_lang: str):
    """Translate text if requested and return (final_text, translation_dict_or_None)"""
    if not enable_translation:
        return text, None
    try:
        return_text = text
        translation = translate_text(text, target_lang)
        if translation and translation.get('success'):
            return_text = translation.get('translated', text)
        return return_text, translation
    except Exception as e:
        logger.warning("Translation failed: %s", e)
        return text, None


def _parse_ocr_request_options(req) -> dict:
    """Extract and normalize options from OCR request."""
    to_format = req.form.get('toFormat', 'docx')
    enable_translation = req.form.get('translate', 'false').lower() == 'true'
    target_lang = req.form.get('targetLang', 'en')
    try:
        dpi = int(req.form.get('dpi', 300)) if req.form.get('dpi') else 300
    except Exception:
        dpi = 300
    return {
        'to_format': to_format,
        'translate': enable_translation,
        'target_lang': target_lang,
        'dpi': dpi}


def _save_and_extract_for_ocr(file: FileStorage, dpi: int):
    """Save uploaded file and perform text extraction via OCR utilities.

    Returns: (input_path, source_ext, extracted_text, ocr_result)
    """
    input_path, source_ext, _ = _save_uploaded_file(file)
    extracted_text, ocr_result = _extract_text_for_ocr(
        input_path, source_ext, dpi)
    return input_path, source_ext, extracted_text, ocr_result


def _build_ocr_convert_response(result: dict):
    """Return the JSON payload for OCR+convert result dict."""
    output_filename = result['output_filename']
    ocr_result = result['ocr_result']
    classification = result['classification']
    translation = result.get('translation')
    lang_detection = result.get('lang_detection', {})
    return {
        'success': True,
        'filename': output_filename,
        'downloadUrl': f'/api/download/{output_filename}',
        'ocr': {
            'confidence': ocr_result.get('confidence'),
            'word_count': ocr_result.get('word_count'),
            'language': lang_detection.get('primary_language'),
            'per_page': ocr_result.get('per_page', [])
        },
        'classification': classification,
        'translation': translation if translation else None
    }


def _process_ocr_and_convert(file: FileStorage, options: dict):

    dpi = int(options.get('dpi', 300) or 300)

    # Save and extract using helper
    input_path, source_ext, extracted_text, ocr_result = _save_and_extract_for_ocr(
        file, dpi)

    try:
        # Classify and detect language
        classification = doc_classifier.classify(extracted_text)
        lang_detection = detect_language_advanced(extracted_text)

        # Optional Translation
        final_text, translation = _translate_if_needed(
            extracted_text, bool(
                options.get(
                    'translate', False)), options.get(
                'target_lang', 'en'))

        if not final_text or not str(final_text).strip():
            try:
                analytics.log_error('ocr_empty', source_ext, options.get(
                    'to_format', 'docx'), 'No text detected from input')
            except Exception:
                pass
            raise ValueError(
                'No text detected in uploaded file. For scanned PDFs/images, ensure the scan is clear or try a different file.')

        output_filename = _finalize_conversion_and_record(
            input_path, final_text, options.get(
                'to_format', 'docx'), source_ext, float(
                ocr_result.get('confidence') or 0.0))
        return {
            'output_filename': output_filename,
            'ocr_result': ocr_result,
            'classification': classification,
            'translation': translation,
            'lang_detection': lang_detection
        }

    finally:
        # Ensure we cleanup the uploaded file here if it's still present
        if input_path and input_path.exists():
            try:
                safe_unlink(input_path)
            except Exception:
                pass


def _finalize_conversion_and_record(
        input_path: Path,
        final_text: str,
        to_format: str,
        source_ext: str,
        ocr_confidence: float) -> str:
    """Create the output document from text, log analytics, and return the filename."""
    output_filename = f"{input_path.stem}.{to_format}"
    output_path = OUTPUT_DIR / output_filename
    _create_document_from_text(final_text, output_path, to_format)
    try:
        analytics.log_conversion(source_ext, to_format, True, ocr_confidence)
    except Exception as e:
        logger.warning("Analytics log failure: %s", e)
    try:
        safe_unlink(input_path)
    except Exception as e:
        logger.warning("Failed to remove input after conversion: %s", e)
    return output_filename


def _extract_text_for_ocr(input_path, source_ext, dpi=300):
    """Delegate extraction to `ocr_utils._extract_text_for_ocr`"""
    return ocr_utils._extract_text_for_ocr(input_path, source_ext, dpi)


@app.route('/api/ocr-and-convert', methods=['POST'])
# pylint: disable=broad-except
def ocr_and_convert():
    """Combined endpoint: OCR + Document Classification + Smart Conversion"""
    if not ML_FEATURES_AVAILABLE:
        return jsonify(
            {'error': 'ML features not available - requires Python 3.11 or older'}), 503

    try:
        # Validate request
        file, _, error_response = _validate_ocr_request()
        if error_response:
            return error_response
        assert isinstance(file, FileStorage)

        options = _parse_ocr_request_options(request)

        try:
            result = _process_ocr_and_convert(file, options)
        except ValueError as e:
            logger.warning("OCR validation error: %s", e)
            return jsonify({'error': str(e)}), 400

        return jsonify(_build_ocr_convert_response(result))

    except Exception as e:
        logger.error("OCR-Convert error: %s", e)
        # Best-effort cleanup
        try:
            analytics.log_error('ocr_convert_failed', 'image', 'docx', str(e))
        except Exception:
            logger.warning(
                "Analytics log error while handling OCR convert failure")
        return jsonify({'error': str(e)}), 500


@app.route('/api/download/<filename>', methods=['GET'])
def download(filename):
    """Download converted file"""
    try:
        # Security: prevent directory traversal
        filename = secure_filename(filename)
        file_path = OUTPUT_DIR / filename

        # Check if file exists
        if not file_path.exists() or not file_path.is_file():
            return jsonify({'error': 'File not found'}), 404

        # Send file
        response = send_file(
            str(file_path),
            as_attachment=True,
            download_name=filename
        )

        _schedule_download_cleanup(response, file_path, filename)
        return response
    except Exception as e:
        logger.error(f"Download error: {e}")
        return jsonify({'error': str(e)}), 500


def _schedule_download_cleanup(response, file_path, filename, delay: int = 5):
    """Attach cleanup handler to response to remove file after a delay."""
    @response.call_on_close
    def cleanup():
        try:
            time.sleep(delay)
            if file_path.exists():
                try:
                    safe_unlink(file_path)
                except Exception:
                    logger.warning(
                        "Failed to safely remove downloaded file: %s", filename)
        except Exception as e:
            logger.error(f"Cleanup error: {e}")


# Serve static files in production
if NODE_ENV == 'production':
    dist_dir = BASE_DIR / 'dist'

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_spa(path):
        if path and (dist_dir / path).exists():
            return send_file(str(dist_dir / path))
        return send_file(str(dist_dir / 'index.html'))


# Run server
if __name__ == '__main__':
    logger.info(f"SwiftConvert running on port {PORT}")
    logger.info(f"Environment: {NODE_ENV}")

    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=False
    )


