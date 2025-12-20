import React, { useState, useRef } from 'react';
import { FileText, X, Download, Zap, Shield, Send, Upload, AlertCircle, CheckCircle, File, Image, FileSpreadsheet, Presentation } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

export default function SwiftConvert() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [showOcrOption, setShowOcrOption] = useState(false);
  const [sourceFormat, setSourceFormat] = useState('');
  const [targetFormat, setTargetFormat] = useState('PDF');
  const [error, setError] = useState('');
  const [convertedFileName, setConvertedFileName] = useState('');
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (response.ok) {
        console.log('Backend server is online');
      }
    } catch (err) {
      setError('Cannot connect to backend server. Make sure it\'s running on port 3001');
    }
  };

  const allowedFormats = {
    'PDF': ['DOCX', 'DOC', 'TXT', 'XLSX', 'CSV', 'PPTX', 'JPG', 'PNG'],
    'DOCX': ['PDF', 'TXT', 'DOC'],
    'DOC': ['PDF', 'TXT', 'DOCX'],
    'TXT': ['PDF', 'DOCX'],
    'XLSX': ['PDF', 'CSV'],
    'CSV': ['PDF', 'XLSX'],
    'PPTX': ['PDF'],
    'JPG': ['PDF', 'PNG'],
    'PNG': ['PDF', 'JPG'],
    'JPEG': ['PDF', 'PNG']
  };

  const getFileIcon = (format) => {
    const fmt = format?.toUpperCase();
    if (fmt === 'PDF') return <FileText className="w-6 h-6" />;
    if (['DOCX', 'DOC', 'TXT'].includes(fmt)) return <File className="w-6 h-6" />;
    if (['XLSX', 'CSV'].includes(fmt)) return <FileSpreadsheet className="w-6 h-6" />;
    if (fmt === 'PPTX') return <Presentation className="w-6 h-6" />;
    if (['JPG', 'JPEG', 'PNG'].includes(fmt)) return <Image className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  const detectFormat = (filename) => {
    const ext = filename.split('.').pop().toUpperCase();
    return ext;
  };

  const isImageOrScannedPDF = (format) => {
    return ['JPG', 'JPEG', 'PNG', 'PDF'].includes(format?.toUpperCase());
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 50MB limit');
      return;
    }

    const format = detectFormat(selectedFile.name);
    
    if (!allowedFormats[format]) {
      setError('Unsupported file format. Please upload PDF, DOCX, DOC, TXT, XLSX, CSV, PPTX, JPG, or PNG files.');
      return;
    }

    setError('');
    setFile(selectedFile);
    setSourceFormat(format);
    setShowOcrOption(isImageOrScannedPDF(format));
    
    if (allowedFormats[format] && allowedFormats[format].length > 0) {
      setTargetFormat(allowedFormats[format][0]);
    }

    setIsComplete(false);
    setProgress(0);
    setConvertedFileName('');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file || !targetFormat) return;

    setIsConverting(true);
    setIsComplete(false);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('toFormat', targetFormat.toLowerCase());

      // Simulate progress while waiting for conversion
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 30, 90));
      }, 300);

      const response = await fetch(`${API_BASE_URL}/api/convert`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Conversion failed with status ${response.status}`);
      }

      const data = await response.json();
      setProgress(100);
      setConvertedFileName(data.filename);
      setIsConverting(false);
      setIsComplete(true);
    } catch (err) {
      setError(err.message || 'Conversion failed. Please try again.');
      setIsConverting(false);
      setProgress(0);
    }
  };

  const handleDownload = async () => {
    if (!convertedFileName) {
      setError('No converted file available');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/download/${convertedFileName}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = convertedFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Reset after download
      setFile(null);
      setIsComplete(false);
      setProgress(0);
      setSourceFormat('');
      setTargetFormat('PDF');
      setConvertedFileName('');
    } catch (err) {
      setError('Failed to download file: ' + err.message);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setSourceFormat('');
    setTargetFormat('PDF');
    setIsComplete(false);
    setProgress(0);
    setShowOcrOption(false);
    setOcrEnabled(false);
    setError('');
    setConvertedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#6366F1"/>
              <path d="M14 8L18 14L14 20M10 8L14 14L10 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xl font-semibold text-gray-700">SwiftConvert</span>
          </div>
          <nav className="flex items-center gap-10">
            <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Home</a>
            <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Features</a>
            <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Pricing</a>
            <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Contact</a>
          </nav>
        </div>
      </header>

      {/* Main Section */}
      <main className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-2 gap-20">
          {/* Left Column */}
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Effortless File Conversion
            </h1>
            <p className="text-gray-600 mb-10 leading-relaxed">
              Quickly convert your documents, images, and other files<br/>
              to any format. Simple, secure, and fast.
            </p>

            {/* Upload Box */}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : file 
                    ? 'border-gray-300' 
                    : 'border-gray-300 hover:border-indigo-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!file ? (
                <div 
                  className="text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">
                    Drag & Drop your file here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                  <p className="text-xs text-gray-400">
                    Supported formats: PDF, DOCX, DOC, TXT, XLSX, CSV, PPTX, JPG, PNG
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Maximum file size: 50MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx,.doc,.txt,.xlsx,.csv,.pptx,.jpg,.jpeg,.png"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-indigo-50 rounded-lg p-4">
                  <div className="text-indigo-600">
                    {getFileIcon(sourceFormat)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{file.name}</div>
                    <div className="text-sm text-gray-500">{formatFileSize(file.size)} • {sourceFormat}</div>
                  </div>
                  <button 
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Convert to */}
            {file && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Convert to
                  </label>
                  <select 
                    value={targetFormat}
                    onChange={(e) => setTargetFormat(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  >
                    {allowedFormats[sourceFormat]?.map(format => (
                      <option key={format} value={format}>{format}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Converting from {sourceFormat} to {targetFormat}
                  </p>
                </div>

                {/* OCR Toggle */}
                {showOcrOption && (
                  <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        Enable OCR
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Recommended</span>
                      </div>
                      <div className="text-sm text-gray-500">Extract text from images and scanned documents</div>
                    </div>
                    <button
                      onClick={() => setOcrEnabled(!ocrEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        ocrEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        ocrEnabled ? 'left-6' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                )}

                {/* Convert Button */}
                <button
                  onClick={handleConvert}
                  disabled={isConverting || !targetFormat}
                  className="w-full py-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-6"
                >
                  {isConverting ? 'Converting...' : 'Convert File'}
                </button>

                {/* Progress */}
                {(isConverting || isComplete) && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">Conversion Progress</div>
                      <div className="text-sm font-semibold text-indigo-600">{Math.round(progress)}%</div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {isComplete && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Conversion complete!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Download Button */}
                {isComplete && (
                  <button 
                    onClick={handleDownload}
                    className="w-full py-4 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Converted File
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right Column - 3D Hand */}
          <div>
            <div className="w-full h-full bg-gradient-to-br from-stone-200 via-amber-100 to-stone-200 rounded-3xl flex items-end justify-center overflow-hidden relative">
              <div className="relative mb-0" style={{ width: '200px', height: '450px' }}>
                <div 
                  className="absolute"
                  style={{
                    width: '60px',
                    height: '100px',
                    background: 'linear-gradient(135deg, #d4a574 0%, #c99464 100%)',
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    bottom: '180px',
                    left: '-10px',
                    transform: 'rotate(-15deg)',
                    boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.1)'
                  }}
                />
                <div 
                  className="absolute"
                  style={{
                    width: '45px',
                    height: '180px',
                    background: 'linear-gradient(180deg, #d4a574 0%, #c99464 100%)',
                    borderRadius: '50% 50% 50% 50% / 80% 80% 20% 20%',
                    bottom: '240px',
                    left: '50px',
                    boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.1)'
                  }}
                />
                <div 
                  className="absolute"
                  style={{
                    width: '42px',
                    height: '140px',
                    background: 'linear-gradient(180deg, #c99464 0%, #ba8456 100%)',
                    borderRadius: '50% 50% 50% 50% / 80% 80% 20% 20%',
                    bottom: '240px',
                    left: '95px',
                    boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.15)'
                  }}
                />
                <div 
                  className="absolute"
                  style={{
                    width: '38px',
                    height: '110px',
                    background: 'linear-gradient(180deg, #ba8456 0%, #a67448 100%)',
                    borderRadius: '50% 50% 50% 50% / 80% 80% 20% 20%',
                    bottom: '240px',
                    left: '135px',
                    boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.15)'
                  }}
                />
                <div 
                  className="absolute"
                  style={{
                    width: '160px',
                    height: '260px',
                    background: 'linear-gradient(180deg, #d4a574 0%, #c99464 50%, #ba8456 100%)',
                    borderRadius: '45% 45% 50% 50% / 40% 40% 60% 60%',
                    bottom: '0',
                    left: '20px',
                    boxShadow: 'inset -10px 0 20px rgba(0,0,0,0.1), inset 0 -10px 20px rgba(0,0,0,0.05)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features at Your Fingertips
            </h2>
            <p className="text-gray-600">
              Our tool provides a comprehensive suite of features to handle all your<br/>
              conversion needs.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-4 border-indigo-100 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Blazing Fast Conversions</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Experience lightning-speed file processing<br/>
                without compromising quality.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-4 border-indigo-100 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your files are protected with industry-leading<br/>
                encryption and deleted after conversion.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-4 border-indigo-100 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Send className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Supports Many Formats</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Convert between a wide array of document,<br/>
                image, and other file types effortlessly.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="#6366F1"/>
                <path d="M14 8L18 14L14 20M10 8L14 14L10 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xl font-semibold text-gray-700">SwiftConvert</span>
            </div>
            <div className="flex items-center gap-10">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">About Us</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms of Service</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Help & Support</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500">
            © 2025 SwiftConvert. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Visily Badge */}
      <div className="fixed bottom-6 left-6 flex items-center gap-2 text-sm text-gray-500">
        <span>Made with</span>
        <div className="flex items-center gap-1.5">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect width="18" height="18" rx="3" fill="#6366F1"/>
            <path d="M6 5L9 9L6 13M12 5L9 9L12 13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="font-semibold text-gray-900">Visily</span>
        </div>
      </div>
    </div>
  );
}
