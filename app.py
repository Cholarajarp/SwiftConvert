from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import shutil
from pathlib import Path
from werkzeug.utils import secure_filename
import logging
import time
import subprocess
from dotenv import load_dotenv
import stripe

# Load environment variables
load_dotenv()

# Import conversion libraries
from pdf2docx import Converter
from PIL import Image
import openpyxl
import pandas as pd
from PyPDF2 import PdfReader, PdfWriter
from docx import Document
from io import BytesIO

# Helper function to reduce code duplication
def handle_conversion_error(error, operation):
    """Centralized error handling for conversions"""
    logger.error(f"{operation} error: {error}")
    raise

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_extension(filename):
    """Get file extension"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def cleanup_old_files():
    """Clean up files older than 24 hours"""
    try:
        current_time = time.time()
        for directory in [UPLOAD_DIR, OUTPUT_DIR]:
            for file_path in directory.glob('*'):
                if not file_path.is_file():
                    continue
                file_age = current_time - file_path.stat().st_mtime
                if file_age > 86400:  # 24 hours
                    file_path.unlink()
                    logger.info(f"Cleaned up old file: {file_path}")
    except Exception as e:
        logger.error(f"Cleanup error: {e}")

# PDF to DOCX conversion
def convert_pdf_to_docx(input_path, output_path):
    """Convert PDF to DOCX using pdf2docx"""
    try:
        cv = Converter(str(input_path))
        cv.convert(str(output_path))
        cv.close()
        logger.info(f"PDF to DOCX conversion successful: {output_path}")
        return output_path
    except Exception as e:
        handle_conversion_error(e, "PDF to DOCX")

# DOCX to PDF conversion
def convert_docx_to_pdf(input_path, output_path):
    """Convert DOCX to PDF using LibreOffice"""
    try:
        result = subprocess.run(
            ['soffice', '--headless', '--convert-to', 'pdf', '--outdir', 
             str(output_path.parent), str(input_path)],
            capture_output=True,
            text=True,
            timeout=60
        )
        if result.returncode == 0 and output_path.exists():
            return output_path
        raise Exception(f"LibreOffice conversion failed: {result.stderr}")
    except FileNotFoundError:
        raise Exception("LibreOffice not installed. Please install LibreOffice for DOCX to PDF conversion.")
    except Exception as e:
        handle_conversion_error(e, "DOCX to PDF")

# Image to PDF conversion
def convert_image_to_pdf(input_path, output_path):
    """Convert image (JPG/PNG) to PDF"""
    try:
        with Image.open(str(input_path)) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                if img.mode in ('RGBA', 'LA'):
                    rgb_img.paste(img, mask=img.split()[-1] if len(img.split()) > 3 else None)
                img = rgb_img
            
            # Save as PDF
            img.save(str(output_path), 'PDF', resolution=100.0, quality=95)
        
        logger.info(f"Image to PDF conversion successful: {output_path}")
        return output_path
    except Exception as e:
        handle_conversion_error(e, "Image to PDF")

# Image to Image conversion
def convert_image_to_image(input_path, output_path, target_format):
    """Convert between image formats"""
    try:
        with Image.open(str(input_path)) as img:
            # Convert RGBA to RGB for JPEG
            if target_format.lower() in ['jpg', 'jpeg'] and img.mode == 'RGBA':
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3] if len(img.split()) == 4 else None)
                rgb_img.save(str(output_path), 'JPEG', quality=95)
            else:
                img.save(str(output_path), format=target_format.upper(), quality=95)
        logger.info(f"Image conversion successful: {output_path}")
        return output_path
    except Exception as e:
        handle_conversion_error(e, "Image conversion")

# CSV to XLSX conversion
def convert_csv_to_xlsx(input_path, output_path):
    """Convert CSV to XLSX"""
    try:
        df = pd.read_csv(str(input_path))
        df.to_excel(str(output_path), index=False, engine='openpyxl')
        logger.info(f"CSV to XLSX conversion successful: {output_path}")
        return output_path
    except Exception as e:
        handle_conversion_error(e, "CSV to XLSX")

# XLSX to CSV conversion
def convert_xlsx_to_csv(input_path, output_path):
    """Convert XLSX to CSV"""
    try:
        df = pd.read_excel(str(input_path), engine='openpyxl')
        df.to_csv(str(output_path), index=False)
        logger.info(f"XLSX to CSV conversion successful: {output_path}")
        return output_path
    except Exception as e:
        handle_conversion_error(e, "XLSX to CSV")

# Document conversions using LibreOffice
def convert_with_libreoffice(input_path, output_path, target_format):
    """Convert documents using LibreOffice"""
    try:
        result = subprocess.run(
            ['soffice', '--headless', '--convert-to', target_format, 
             '--outdir', str(output_path.parent), str(input_path)],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0 and output_path.exists():
            return output_path
        
        raise Exception(f"LibreOffice conversion failed: {result.stderr}")
    except FileNotFoundError:
        raise Exception("LibreOffice not installed. Please install LibreOffice for document conversions.")
    except Exception as e:
        handle_conversion_error(e, "LibreOffice conversion")

# Conversion routing helpers
def _is_pdf_to_doc(source, target):
    return source == 'pdf' and target in ['docx', 'doc']

def _is_doc_to_pdf(source, target):
    return source in ['docx', 'doc'] and target == 'pdf'

def _is_image_to_pdf(source, target):
    return source in ['jpg', 'jpeg', 'png'] and target == 'pdf'

def _is_image_conversion(source, target):
    return source in ['jpg', 'jpeg', 'png'] and target in ['jpg', 'jpeg', 'png']

def _is_csv_xlsx_conversion(source, target):
    return (source == 'csv' and target == 'xlsx') or (source == 'xlsx' and target == 'csv')

def _is_csv_to_pdf(source, target):
    return source == 'csv' and target == 'pdf'

def _is_libreoffice_format(source):
    return source in ['docx', 'doc', 'odt', 'rtf', 'txt', 'xlsx', 'xls', 'ods', 'pptx', 'odp']

# Main conversion router
def convert_file(input_path, output_path, source_ext, target_ext):
    """Route to appropriate conversion function"""
    source_ext = source_ext.lower()
    target_ext = target_ext.lower()
    
    if _is_pdf_to_doc(source_ext, target_ext):
        return convert_pdf_to_docx(input_path, output_path)
    elif _is_doc_to_pdf(source_ext, target_ext):
        return convert_docx_to_pdf(input_path, output_path)
    elif _is_image_to_pdf(source_ext, target_ext):
        return convert_image_to_pdf(input_path, output_path)
    elif _is_image_conversion(source_ext, target_ext):
        return convert_image_to_image(input_path, output_path, target_ext)
    elif source_ext == 'csv' and target_ext == 'xlsx':
        return convert_csv_to_xlsx(input_path, output_path)
    elif source_ext == 'xlsx' and target_ext == 'csv':
        return convert_xlsx_to_csv(input_path, output_path)
    elif _is_csv_to_pdf(source_ext, target_ext):
        temp_xlsx = output_path.parent / f"{uuid.uuid4()}.xlsx"
        convert_csv_to_xlsx(input_path, temp_xlsx)
        result = convert_with_libreoffice(temp_xlsx, output_path, 'pdf')
        temp_xlsx.unlink()
        return result
    elif _is_libreoffice_format(source_ext):
        return convert_with_libreoffice(input_path, output_path, target_ext)
    else:
        raise Exception(f"Conversion from {source_ext} to {target_ext} is not supported")

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
        plan = data.get('plan', 'pro')
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
        logger.error(f"Stripe checkout error: {str(e)}")
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
        logger.error(f"Invalid payload: {e}")
        return jsonify({'error': 'Invalid payload'}), 400
    except Exception as e:
        logger.error(f"Invalid signature: {e}")
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        logger.info(f"Payment successful for session: {session.get('id')}")
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

def _save_uploaded_file(file):
    """Save uploaded file and return paths"""
    original_filename = secure_filename(file.filename or 'upload')
    source_ext = get_file_extension(original_filename)
    unique_id = str(uuid.uuid4())
    input_filename = f"{unique_id}-{original_filename}"
    input_path = UPLOAD_DIR / input_filename
    file.save(str(input_path))
    logger.info(f"File uploaded: {input_filename}")
    return input_path, source_ext

def _check_file_size(file_path):
    """Check if file size is within limit"""
    if file_path.stat().st_size > MAX_FILE_SIZE:
        file_path.unlink()
        raise ValueError('File size exceeds 100MB limit')

@app.route('/api/convert', methods=['POST'])
def convert():
    """File conversion endpoint"""
    input_path = None
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        to_format = request.form.get('toFormat', '').lower()
        
        # Validate file and format
        _validate_conversion_request(file, to_format)
        
        # Save and validate uploaded file
        input_path, source_ext = _save_uploaded_file(file)
        _check_file_size(input_path)
        
        # Generate output filename
        output_filename = f"{input_path.stem}.{to_format}"
        output_path = OUTPUT_DIR / output_filename
        
        # Perform conversion
        logger.info(f"Starting conversion: {source_ext} -> {to_format}")
        convert_file(input_path, output_path, source_ext, to_format)
        
        # Clean up input file
        input_path.unlink()
        cleanup_old_files()
        
        return jsonify({
            'success': True,
            'filename': output_filename,
            'downloadUrl': f'/api/download/{output_filename}'
        })
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Conversion error: {str(e)}")
        if input_path is not None and input_path.exists():
            input_path.unlink()
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
        
        # Schedule file deletion after 5 seconds
        @response.call_on_close
        def cleanup():
            try:
                time.sleep(5)
                if file_path.exists():
                    file_path.unlink()
                    logger.info(f"Cleaned up downloaded file: {filename}")
            except Exception as e:
                logger.error(f"Cleanup error: {e}")
        
        return response
    
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return jsonify({'error': 'Download failed'}), 500

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
    logger.info(f"🚀 SwiftConvert Python Backend running on http://localhost:{PORT}")
    logger.info(f"📁 Upload directory: {UPLOAD_DIR}")
    logger.info(f"📁 Output directory: {OUTPUT_DIR}")
    logger.info(f"📦 Environment: {NODE_ENV}")
    logger.info(f"✅ Supporting 15 file formats")
    
    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=(NODE_ENV == 'development')
    )
