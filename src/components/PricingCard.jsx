import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PricingCard({ plan, price, period, features, buttonText, buttonAction, isPopular = false }) {
  const isPro = plan === 'Pro';
  const isEnterprise = plan === 'Enterprise';

  return (
    <div className={`border-2 ${isPopular ? 'border-indigo-600 relative' : 'border-gray-200'} rounded-2xl p-8 bg-white hover:shadow-lg transition-shadow`}>
      {isPopular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </span>
      )}
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan}</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">{price}</span>
          <span className="text-gray-600">{period}</span>
        </div>
        
        {buttonAction ? (
          <button
            onClick={buttonAction}
            className={`w-full py-3 font-medium rounded-lg transition-colors mb-6 ${
              isPopular 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {buttonText}
          </button>
        ) : (
          <Link
            to={isEnterprise ? '/contact' : '/'}
            className={`block w-full py-3 font-medium rounded-lg transition-colors mb-6 text-center ${
              isPopular
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {buttonText}
          </Link>
        )}
        
        <ul className="text-left space-y-3 text-sm text-gray-600">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
