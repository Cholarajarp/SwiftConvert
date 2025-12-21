# Python backend (Flask)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for LibreOffice and other tools
RUN apt-get update && apt-get install -y \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .
COPY .env.example .env

# Create upload and converted directories
RUN mkdir -p uploads converted

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:3001/api/health')" || exit 1

# Run the application
CMD ["python", "app.py"]
