import { Mail, MessageCircle, Book, ExternalLink } from 'lucide-react';

export default function HelpSupport() {
  const supportEmail = "ccholarajarp@gmail.com";
  const githubIssues = "https://github.com/yourusername/swiftconvert/issues";
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col gap-2">
        {/* Contact Email Button */}
        <a
          href={`mailto:${supportEmail}?subject=SwiftConvert Support Request`}
          className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          title="Contact Support"
        >
          <Mail className="w-5 h-5" />
          <span className="hidden group-hover:inline-block text-sm font-medium">
            Contact Support
          </span>
        </a>

        {/* Help Documentation */}
        <button
          onClick={() => window.open('/help', '_blank')}
          className="group flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          title="Help & Documentation"
        >
          <Book className="w-5 h-5" />
          <span className="hidden group-hover:inline-block text-sm font-medium">
            Help
          </span>
        </button>

        {/* Report Issue */}
        <a
          href={githubIssues}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          title="Report an Issue"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden group-hover:inline-block text-sm font-medium">
            Report Issue
          </span>
        </a>
      </div>

      {/* Help Tooltip */}
      <div className="absolute bottom-full right-0 mb-4 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-xs">
          <h4 className="font-semibold mb-2">Need Help?</h4>
          <ul className="space-y-1 text-gray-300">
            <li>📧 Email: {supportEmail}</li>
            <li>📚 Check documentation</li>
            <li>🐛 Report bugs on GitHub</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
