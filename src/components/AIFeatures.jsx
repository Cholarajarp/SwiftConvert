import React, { useState } from 'react';
import { Brain, FileText, Languages, Sparkles, BarChart3, Zap } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

export default function AIFeatures({ onOCRConvert }) {
  // Show AI panel open by default to make it easily discoverable
  const [showAI, setShowAI] = useState(true);
  const [ocrFile, setOCRFile] = useState(null);
  const [ocrResult, setOCRResult] = useState(null);
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enableTranslation, setEnableTranslation] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const [highQuality, setHighQuality] = useState(false); // Higher DPI (slower) for better OCR accuracy

  const handleOCRSubmit = async (e) => {
    e.preventDefault();
    if (!ocrFile) return;

    setLoading(true);

    // Quick health check so we can show a clearer message on failure
    try {
      const health = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET' });
      if (!health.ok) {
        throw new Error('Backend health check failed');
      }
    } catch (err) {
      console.error('Backend health check failed:', err);
      setLoading(false);
      alert('Cannot reach the backend server. Make sure the backend is running on port 3001 and try again.');
      return;
    }

    const formData = new FormData();
    formData.append('file', ocrFile);
    // FormData will stringify booleans to "true"/"false"
    formData.append('translate', enableTranslation);
    formData.append('targetLang', targetLang);
    formData.append('toFormat', 'docx');
    // DPI for PDF rendering (higher DPI = better accuracy, slower)
    formData.append('dpi', highQuality ? '300' : '200');

    try {
      const response = await fetch(`${API_BASE_URL}/api/ocr-and-convert`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 503) {
          alert(errData.error || 'OCR not available: ML features missing on server (install EasyOCR/PyTorch)');
        } else if (response.status === 400) {
          alert(errData.error || 'Bad request for OCR. Check file and try again.');
        } else {
          alert(errData.error || `OCR failed with status ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setOCRResult(data);
        if (onOCRConvert) onOCRConvert(data);
      } else {
        alert(data.error || 'OCR processing failed');
      }
    } catch (error) {
      console.error('OCR error:', error);
      // Network/CORS errors show up here as TypeError: Failed to fetch
      alert('Network error: failed to reach OCR service. Check backend (CORS, network) or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t pt-8">
      <button
        onClick={() => setShowAI(!showAI)}
        className="w-full flex items-center justify-between gap-3 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 mb-4 px-6 py-3 rounded-lg shadow-lg animate-pulse"
      >
        <div className="flex items-center gap-3">
          <Brain className="w-7 h-7" />
          <span>AI / ML Features</span>
        </div>
        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{showAI ? 'Open' : 'Closed'}</span>
      </button>

      {showAI && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OCR + Translation */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-purple-700" />
              <h3 className="font-semibold text-2xl text-gray-900">OCR + Translation</h3>
            </div>
            
            <form onSubmit={handleOCRSubmit} className="space-y-4">
              <div>
                <label className="block text-md font-medium text-gray-800 mb-2">
                  Upload Image or PDF for Text Extraction
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setOCRFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableTranslation"
                    checked={enableTranslation}
                    onChange={(e) => setEnableTranslation(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="enableTranslation" className="text-sm text-gray-700">
                    Enable Translation
                  </label>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <input
                    type="checkbox"
                    id="highQuality"
                    checked={highQuality}
                    onChange={(e) => setHighQuality(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="highQuality" className="text-sm text-gray-700">
                    High quality OCR (slower)
                  </label>
                </div>
              </div>

              {enableTranslation && (
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-2"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="kn">Kannada</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              )}

              <button
                type="submit"
                disabled={!ocrFile || loading}
                className="w-full bg-purple-700 text-white py-3 rounded-lg hover:bg-purple-800 disabled:bg-gray-300 transition-colors text-lg font-semibold"
              >
                {loading ? 'Processing...' : 'Extract Text & Convert'}
              </button>
            </form>

            {ocrResult && (
              <div className="mt-4 p-4 bg-white rounded border border-purple-200 shadow-sm">
                <p className="text-lg font-semibold text-gray-900 mb-3">Results</p>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 mb-3">
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-purple-700">Confidence</p>
                    <p className="font-semibold text-purple-800">{(ocrResult.ocr.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Words</p>
                    <p className="font-semibold">{ocrResult.ocr.word_count}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Language</p>
                    <p className="font-semibold">{ocrResult.ocr.language}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-semibold">{ocrResult.classification.category}</p>
                  </div>
                </div>

                {/* Per-page confidence display */}
                {ocrResult.ocr.per_page && ocrResult.ocr.per_page.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">Per-page OCR Confidence</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                      {ocrResult.ocr.per_page.map((p) => (
                        <div key={p.page} className="p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500">Page {p.page + 1}</div>
                          <div className="font-semibold">{(p.confidence * 100).toFixed(1)}% • {p.words} words</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={`http://localhost:3001${ocrResult.downloadUrl}`}
                  className="inline-block w-full text-center bg-purple-700 text-white py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors mt-4"
                >
                  Download DOCX
                </a>
              </div>
            )}
          </div>

          {/* Smart Recommendations */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-2xl text-gray-900">Smart Features</h3>
            </div>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Format Recommendation</p>
                  <p className="text-sm text-gray-600">AI suggests best output format</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Document Classification</p>
                  <p className="text-sm text-gray-600">Auto-detect: invoice, resume, legal doc</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Languages className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Multi-Language Support</p>
                  <p className="text-sm text-gray-600">English, Hindi, Kannada + more</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Quality Scoring</p>
                  <p className="text-sm text-gray-600">AI predicts conversion quality</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white text-center">
              <p className="text-sm font-medium">Powered by</p>
              <p className="text-xs">EasyOCR • Transformers • scikit-learn</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
