import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, X, Download, Zap, Shield, Send, Upload, AlertCircle, CheckCircle, File, Image, FileSpreadsheet, Presentation } from 'lucide-react';
import AIFeatures from './components/AIFeatures';
import HelpSupport from './components/HelpSupport';

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
  const [dpi, setDpi] = useState(300);
  const [ocrResult, setOcrResult] = useState(null);
  const fileInputRef = useRef(null);

  // Navigation handler for smooth scrolling
  const handleNavClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  // Restrict client-side options to only supported conversions to match backend
  const allowedFormats = {
    'PDF': ['DOCX'],           // PDF -> DOCX
    'DOCX': ['PDF', 'TXT'],    // DOCX -> PDF, DOCX -> TXT (export)
    'DOC': ['PDF', 'DOCX'],
    'TXT': ['PDF', 'DOCX'],
    'MD': ['DOCX', 'PDF'],
    'HTML': ['DOCX', 'PDF'],
    'JPG': ['PDF'],
    'JPEG': ['PDF'],
    'PNG': ['PDF'],
    'CSV': ['XLSX', 'PDF'],
    'XLSX': ['CSV'],
    'XLS': ['CSV'],
    'ODS': ['XLSX'],
    'ODT': ['DOCX', 'PDF'],
    'RTF': ['DOCX', 'PDF'],
    'PPTX': ['PDF'],
    'ODP': ['PDF']
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
      setError('Unsupported file format. Please upload PDF, DOCX, DOC, ODT, RTF, TXT, MD, HTML, XLSX, XLS, ODS, CSV, PPTX, ODP, JPG, JPEG, or PNG files.');
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
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('toFormat', targetFormat.toLowerCase());

      // If OCR is enabled, route to the combined OCR+convert endpoint and pass DPI
      let endpoint = `${API_BASE_URL}/api/convert`;
      if (ocrEnabled) {
        endpoint = `${API_BASE_URL}/api/ocr-and-convert`;
        formData.append('dpi', dpi.toString());
        formData.append('translate', 'false');
      }

      // Simulate progress while waiting for conversion
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 30, 90));
      }, 300);

      const response = await fetch(endpoint, {
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

      if (ocrEnabled) {
        setOcrResult(data.ocr || null);
      }
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
    setOcrResult(null);
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
            <button onClick={() => handleNavClick('home')} className="text-sm text-gray-700 hover:text-gray-900 transition cursor-pointer">Home</button>
            <button onClick={() => handleNavClick('features')} className="text-sm text-gray-700 hover:text-gray-900 transition cursor-pointer">Features</button>
            <button onClick={() => handleNavClick('pricing')} className="text-sm text-gray-700 hover:text-gray-900 transition cursor-pointer">Pricing</button>
            <a href="mailto:support@swiftconvert.com" className="text-sm text-gray-700 hover:text-gray-900 transition">Contact</a>
          </nav>
        </div>
      </header>

      {/* Main Section */}
      <main id="home" className="max-w-7xl mx-auto px-8 py-20">
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
                    Supported conversions: PDF↔DOCX, Image→PDF, CSV↔XLSX, CSV→PDF, TXT/MD↔DOCX, TXT→PDF
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Maximum file size: 50MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx,.doc,.odt,.rtf,.txt,.md,.html,.xlsx,.xls,.ods,.csv,.pptx,.odp,.jpg,.jpeg,.png"
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
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          Enable OCR
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Recommended</span>
                        </div>
                        <div className="text-sm text-gray-500">Extract text from images and scanned documents</div>
                      </div>
                      <div className="ml-4">
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
                    </div>

                    {/* DPI selector shown only when OCR is enabled */}
                    {ocrEnabled && (
                      <div className="mt-4 flex items-center gap-4">
                        <div className="text-sm text-gray-700">OCR Quality (DPI)</div>
                        <select value={dpi} onChange={(e) => setDpi(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded">
                          <option value={150}>150 (fast)</option>
                          <option value={200}>200</option>
                          <option value={300}>300 (default)</option>
                          <option value={400}>400 (high quality, slower)</option>
                        </select>
                        <div className="text-xs text-gray-500">Higher DPI improves recognition but increases processing time.</div>
                      </div>
                    )}
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
                  <>
                    <button 
                      onClick={handleDownload}
                      className="w-full py-4 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mb-4"
                    >
                      <Download className="w-5 h-5" />
                      Download Converted File
                    </button>

                    {/* OCR Summary */}
                    {ocrResult && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
                        <div className="font-medium mb-2">OCR Summary</div>
                        <div>Confidence: {ocrResult.confidence ?? ocrResult.confidence}</div>
                        <div>Words: {ocrResult.word_count ?? ocrResult.word_count}</div>
                        <div>Language: {ocrResult.language ?? ocrResult.language}</div>
                        {ocrResult.per_page && ocrResult.per_page.length > 0 && (
                          <div className="text-xs text-gray-500 mt-2">Pages: {ocrResult.per_page.map(p => `#${p.page}:${p.words}w/${p.confidence}`).join(', ')}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* AI/ML Features Section */}
            <div id="ai-features" className="mt-8">
              <div className="mb-4">
                <button onClick={() => handleNavClick('ai-features')} className="w-full text-left bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-5 rounded-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition">
                  <div className="flex items-center gap-4">
                    <Zap className="w-6 h-6" />
                    <div>
                      <div className="text-lg font-bold">AI / ML Features — OCR, Translate & Smart Recommendations</div>
                      <div className="text-xs opacity-90">Quickly extract text, auto-classify documents and get output suggestions</div>
                    </div>
                    <div className="ml-auto text-sm bg-white/20 px-3 py-1 rounded-full">Try Now</div>
                  </div>
                </button>
              </div>
              <AIFeatures onOCRConvert={(data) => { setIsComplete(true); setConvertedFileName(data.filename); }} />
            </div>
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
        <section id="features" className="mt-32">
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

        {/* Pricing Section */}
        <section id="pricing" className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600">
              Choose the plan that's right for you.<br/>
              All plans include our core conversion features.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="border-2 border-gray-200 rounded-2xl p-8 bg-white hover:shadow-lg transition-shadow">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">₹0</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors mb-6"
                >
                  Get Started
                </button>
                <ul className="text-left space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>5 conversions per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>15 file formats supported</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Up to 50MB file size</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Basic conversion quality</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-indigo-600 rounded-2xl p-8 bg-gradient-to-br from-indigo-50 to-white hover:shadow-xl transition-shadow relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">₹49</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <button 
                  onClick={() => alert('Pro plan coming soon! Contact support@swiftconvert.com for early access.')}
                  className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors mb-6"
                >
                  Upgrade to Pro - ₹19/month
                </button>
                <ul className="text-left space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Unlimited conversions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>15 file formats supported</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Up to 200MB file size</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>High quality conversions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Batch processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="border-2 border-gray-200 rounded-2xl p-8 bg-white hover:shadow-lg transition-shadow">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">Custom</span>
                </div>
                <button 
                  onClick={() => window.location.href = 'mailto:support@swiftconvert.com?subject=Enterprise Plan Inquiry'}
                  className="w-full py-3 bg-white border-2 border-gray-300 text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors mb-6"
                >
                  Contact Sales
                </button>
                <ul className="text-left space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Unlimited conversions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Custom file size limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Dedicated support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>SLA guarantee</span>
                  </li>
                </ul>
              </div>
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
              <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900 transition">About Us</Link>
              <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition">Terms of Service</Link>
              <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition">Privacy Policy</Link>
              <a href="mailto:support@swiftconvert.com" className="text-sm text-gray-600 hover:text-gray-900 transition">Help & Support</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/Cholarajarp/SwiftConvert" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600 transition" title="GitHub">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/cholaraja-r-p-4128a624b" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600 transition" title="LinkedIn">
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
          <span className="font-semibold text-gray-900">SwiftConvert</span>
        </div>
      </div>

      {/* Help & Support Floating Button */}
      <HelpSupport />
    </div>
  );
}
