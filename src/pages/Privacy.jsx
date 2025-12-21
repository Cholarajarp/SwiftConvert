import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
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
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-500 mb-12">Last updated: December 21, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              At SwiftConvert, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, and protect your information when you use our file conversion service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Files You Upload</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              When you use SwiftConvert, you upload files for conversion. These files are temporarily stored 
              on our servers during the conversion process and are automatically deleted within 24 hours.
            </p>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Usage Information</h3>
            <p className="text-gray-600 leading-relaxed">
              We collect basic usage information such as conversion types, file sizes, and timestamps to 
              improve our service. This data is anonymized and does not contain personal information.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>To provide and improve our file conversion service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>To analyze usage patterns and optimize performance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>To detect and prevent fraud or abuse</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>To communicate with you about service updates</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard security measures to protect your files:
            </p>
            <ul className="space-y-3 text-gray-600 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>All file transfers use SSL/TLS encryption</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Files are stored in secure, encrypted storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Automatic deletion of files after conversion</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Regular security audits and updates</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">File Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              Uploaded files and converted files are automatically deleted from our servers within 24 hours 
              of upload. We do not permanently store your files unless you explicitly request us to do so 
              (available in Enterprise plans only).
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not share your files with third-party services. All conversions are performed on our 
              own secure servers.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Request deletion of your data at any time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Access information about how we use your data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Opt-out of non-essential data collection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Contact us with privacy concerns</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@swiftconvert.com" className="text-indigo-600 hover:text-indigo-700">
                privacy@swiftconvert.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>
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