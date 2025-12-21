import React from 'react';
import { Link } from 'react-router-dom';

export default function PageHeader() {
  return (
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
  );
}
