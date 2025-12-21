import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
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
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-500 mb-12">Last updated: December 21, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing and using SwiftConvert, you accept and agree to be bound by the terms and 
              conditions of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              SwiftConvert provides an online file conversion service that allows users to convert between 
              various file formats including documents, spreadsheets, presentations, and images. The service 
              is provided "as is" and we reserve the right to modify or discontinue the service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-600 leading-relaxed mb-4">You agree to:</p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Use the service only for lawful purposes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Not upload files containing malware, viruses, or harmful content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Not attempt to reverse engineer or compromise the service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Not upload copyrighted material without proper authorization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Respect the usage limits of your chosen plan</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">4. File Usage and Ownership</h2>
            <p className="text-gray-600 leading-relaxed">
              You retain all rights to the files you upload. We do not claim any ownership of your content. 
              Files are automatically deleted from our servers after conversion (within 24 hours). We do not 
              use your files for any purpose other than performing the requested conversion.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">5. Service Limitations</h2>
            <p className="text-gray-600 leading-relaxed mb-4">Free accounts are subject to:</p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>5 conversions per day</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Maximum file size of 50MB</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Standard conversion quality</span>
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Paid plans have different limitations as specified in the pricing page.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">6. Payment and Refunds</h2>
            <p className="text-gray-600 leading-relaxed">
              Paid subscriptions are billed monthly or annually as selected. We offer a 30-day money-back 
              guarantee for new subscriptions. Refunds are processed within 5-7 business days. You can 
              cancel your subscription at any time, and you will continue to have access until the end of 
              your billing period.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-gray-600 leading-relaxed">
              SwiftConvert is provided "as is" without any warranties, expressed or implied. We do not 
              guarantee that the service will be uninterrupted, error-free, or completely secure. We are 
              not responsible for any loss of data or damages resulting from the use of our service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              In no event shall SwiftConvert be liable for any indirect, incidental, special, or 
              consequential damages arising out of or in connection with the use of our service. Our 
              total liability shall not exceed the amount paid by you for the service in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">9. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to terminate or suspend access to our service immediately, without 
              prior notice, for any reason, including but not limited to breach of these Terms. Upon 
              termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any 
              significant changes via email or through the service. Continued use of the service after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@swiftconvert.com" className="text-indigo-600 hover:text-indigo-700">
                legal@swiftconvert.com
              </a>
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