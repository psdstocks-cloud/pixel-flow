'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 9.99,
    period: 'monthly',
    features: [
      '100 download credits/month',
      'Standard quality downloads',
      'Email support',
      'Cancel anytime',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    credits: 500,
    price: 29.99,
    period: 'monthly',
    popular: true,
    features: [
      '500 download credits/month',
      'High quality downloads',
      'Priority support',
      'Advanced analytics',
      'API access',
      'Cancel anytime',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    credits: 2000,
    price: 99.99,
    period: 'monthly',
    features: [
      '2000 download credits/month',
      'Ultra high quality',
      '24/7 dedicated support',
      'Team collaboration',
      'Custom integrations',
      'White-label options',
      'Cancel anytime',
    ],
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    
    // Check if user is logged in
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Redirect to signup with plan info
      window.location.href = `/signup?plan=${planId}`;
      return;
    }
    
    // Redirect to checkout
    window.location.href = `/checkout?plan=${planId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Choose the perfect plan for your needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white/10 rounded-lg p-1 backdrop-blur-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const displayPrice = billingPeriod === 'yearly' 
              ? (plan.price * 12 * 0.8).toFixed(2) 
              : plan.price.toFixed(2);
            const monthlyEquivalent = billingPeriod === 'yearly'
              ? (plan.price * 0.8).toFixed(2)
              : null;

            return (
              <div
                key={plan.id}
                className={`relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 transition-transform hover:scale-105 ${
                  plan.popular
                    ? 'border-purple-500 shadow-2xl shadow-purple-500/50'
                    : 'border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">${displayPrice}</span>
                    <span className="text-gray-300 ml-2">
                      /{billingPeriod === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  {monthlyEquivalent && (
                    <p className="text-sm text-green-400 mt-1">
                      ${monthlyEquivalent}/month when billed yearly
                    </p>
                  )}
                  <p className="text-purple-400 font-semibold mt-2">
                    {plan.credits} credits/month
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-gray-300">
                      <svg
                        className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={selectedPlan === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } disabled:opacity-50`}
                >
                  {selectedPlan === plan.id ? 'Processing...' : 'Get Started'}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                What are download credits?
              </h3>
              <p className="text-gray-300">
                Each download credit allows you to download one stock image, video, or design asset. Credits renew monthly with your subscription.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-300">
                Yes! All plans can be cancelled at any time. You will retain access until the end of your billing period.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Do unused credits roll over?
              </h3>
              <p className="text-gray-300">
                No, credits reset at the beginning of each billing cycle. Make sure to use your credits before they expire!
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-300 mb-4">
            Need a custom plan for your enterprise?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium"
          >
            Contact Sales
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
