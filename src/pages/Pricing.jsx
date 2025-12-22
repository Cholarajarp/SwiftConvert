import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import PricingCard from '../components/PricingCard';

export default function Pricing() {
  const [loading, setLoading] = useState(false);

  const handleProUpgrade = async () => {
    try {
      setLoading(true);

      // Ask user for an email to associate with the subscription (used to activate Pro access)
      const email = window.prompt('Enter the email address you want to use for Pro (you will receive receipts):');
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        alert('Please enter a valid email address.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro', currency: 'inr', email })
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      alert('Payment system temporarily unavailable. Please contact support@swiftconvert.com');
      setLoading(false);
    }
  };

  const freePlanFeatures = [
    '5 conversions per day',
    'Max 10MB file size',
    '15 file formats supported',
    'Basic conversion speed',
    'Email support'
  ];

  const proPlanFeatures = [
    'Unlimited conversions',
    'Max 100MB file size',
    '15 file formats supported',
    'Priority conversion speed',
    'No watermarks',
    'Priority email support',
    'Batch conversions',
    'API access'
  ];

  const enterpriseFeatures = [
    'Everything in Pro',
    'Custom file size limits',
    'Dedicated account manager',
    '24/7 phone support',
    'Custom integrations',
    'SLA guarantee',
    'Advanced security features',
    'Volume discounts'
  ];

  return (
    <div className="min-h-screen bg-white">
      <PageHeader />

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">
            Choose the plan that's right for you. All plans include our core conversion features.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            plan="Free"
            price="$0"
            period="/month"
            features={freePlanFeatures}
            buttonText="Get Started"
          />

          <PricingCard
            plan="Pro"
            price="₹49"
            period="/month"
            features={proPlanFeatures}
            buttonText={loading ? 'Processing...' : 'Upgrade to Pro'}
            buttonAction={handleProUpgrade}
            isPopular={true}
          />

          <PricingCard
            plan="Enterprise"
            price="Custom"
            period=""
            features={enterpriseFeatures}
            buttonText="Contact Sales"
          />
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto text-left space-y-6 mt-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h3>
              <p className="text-gray-600">Yes, you can change your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, PayPal, and bank transfers for enterprise plans.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Is there a money-back guarantee?</h3>
              <p className="text-gray-600">Yes, we offer a 30-day money-back guarantee for all paid plans, no questions asked.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-8 text-center text-sm text-gray-500">
          © 2025 SwiftConvert. All rights reserved.
        </div>
      </footer>
    </div>
  );
}