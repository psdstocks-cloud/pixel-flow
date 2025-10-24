'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    basePrice: 9.99,
    features: [
      '50 Credits (one-time)',
      'Access to 49+ stock sites',
      '2 credits per download',
      'HD quality downloads',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 200,
    basePrice: 29.99,
    popular: true,
    features: [
      '200 Credits (one-time)',
      'Access to 49+ stock sites',
      '2 credits per download',
      '4K quality downloads',
      'Priority support',
      'Download history',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    credits: 500,
    basePrice: 69.99,
    features: [
      '500 Credits (one-time)',
      'Access to 49+ stock sites',
      '2 credits per download',
      '4K quality downloads',
      '24/7 Priority support',
      'Advanced analytics',
      'API access',
    ],
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<1 | 2 | 3>(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    setLoading(false);
  };

  const calculatePrice = (basePrice: number, months: 1 | 2 | 3) => {
    let totalPrice = basePrice;

    if (months === 2) {
      totalPrice = basePrice * 1.15;
    } else if (months === 3) {
      totalPrice = basePrice * 1.40;
    }

    return totalPrice;
  };

  const handleSubscribe = async (planId: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store plan details in localStorage for after login
      const plan = PLANS.find(p => p.id === planId);
      const totalPrice = calculatePrice(plan!.basePrice, billingCycle);
      
      localStorage.setItem('pendingPurchase', JSON.stringify({
        plan: planId,
        cycle: billingCycle,
        totalPrice: totalPrice.toFixed(2),
        credits: plan!.credits
      }));

      // Redirect to signup page
      router.push('/signup?redirect=payment');
      return;
    }

    // User is authenticated, proceed to payment
    const plan = PLANS.find(p => p.id === planId);
    const totalPrice = calculatePrice(plan!.basePrice, billingCycle);
    
    router.push(
      `/payment?plan=${planId}&cycle=${billingCycle}&totalPrice=${totalPrice.toFixed(2)}&credits=${plan!.credits}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-white/70 text-xl">
            Choose the perfect plan for your needs
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-12">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-2 inline-flex gap-2">
            <button
              onClick={() => setBillingCycle(1)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                billingCycle === 1
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              1 Month
            </button>
            <button
              onClick={() => setBillingCycle(2)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
                billingCycle === 2
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              2 Months
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                +15%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle(3)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
                billingCycle === 3
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              3 Months
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                +40%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const totalPrice = calculatePrice(plan.basePrice, billingCycle);
            
            return (
              <div
                key={plan.id}
                className={`backdrop-blur-xl border rounded-3xl p-8 relative transition-all hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-purple-600/30 to-blue-600/30 border-purple-400/50'
                    : 'bg-white/10 border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mt-2">
                    {billingCycle} month{billingCycle > 1 ? 's' : ''} access
                  </p>
                  <p className="text-green-400 font-semibold text-sm mt-1">
                    {plan.credits} credits (one-time)
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/80">
                      <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  } disabled:opacity-50`}
                >
                  Get Started
                </button>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-white/60">
            All plans include access to 49+ premium stock sites • Cancel anytime • Secure payment
          </p>
        </div>
      </div>
    </div>
  );
}
