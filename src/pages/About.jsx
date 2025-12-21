import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Zap, Users, Globe, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#6366F1"/>
              <path d="M14 8L18 14L14 20M10 8L14 14L10 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xl font-semibold text-gray-700">SwiftConvert</span>
          </Link>
          <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">← Back to Home</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">About SwiftConvert</h1>
        <p className="text-xl text-gray-600 mb-12 leading-relaxed">
          We're on a mission to make file conversion simple, fast, and accessible to everyone.
        </p>

        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            SwiftConvert was born out of frustration with complex, slow, and insecure file conversion tools. 
            We built a platform that prioritizes speed, security, and simplicity. Whether you're converting 
            documents for work, images for a project, or spreadsheets for analysis, SwiftConvert makes it effortless.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-12">What We Offer</h2>
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 p-6 rounded-lg">
              <FileText className="w-10 h-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">15 File Formats</h3>
              <p className="text-gray-600">Support for PDF, DOCX, DOC, ODT, RTF, TXT, MD, HTML, XLSX, XLS, ODS, CSV, PPTX, ODP, and images.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <Zap className="w-10 h-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Our optimized conversion engine delivers results in seconds, not minutes.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <Shield className="w-10 h-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your files are encrypted and automatically deleted after conversion.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <Globe className="w-10 h-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Installation</h3>
              <p className="text-gray-600">Works entirely in your browser. No software to download or install.</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Award className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900">Quality First:</strong>
                <span className="text-gray-600"> We never compromise on conversion quality.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900">Privacy Matters:</strong>
                <span className="text-gray-600"> Your data is yours. We don't store or share your files.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Users className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900">User-Centric:</strong>
                <span className="text-gray-600"> We design for real people solving real problems.</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="mt-12 p-8 bg-indigo-50 rounded-xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">Join thousands of users who trust SwiftConvert for their file conversion needs.</p>
          <Link 
            to="/"
            className="inline-block px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Converting Now
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-8 text-center text-sm text-gray-500">
          © 2025 SwiftConvert. All rights reserved.
        </div>
      </footer>
    </div>
  );
}