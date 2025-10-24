'use client'

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  
  const plan = searchParams.get('plan');
  const cycle = parseInt(searchParams.get('cycle') || '1');
  const monthlyPrice = parseFloat(searchParams.get('monthlyPrice') || '0');
  const totalPrice = parseFloat(searchParams.get('totalPrice') || '0');
  const credits = parseInt(searchParams.get('credits') || '0');

  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePayment = async () => {
    setProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create subscription record
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + cycle);

    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: plan,
      status: 'active',
      credits: credits / cycle, // Monthly credits
      billing_cycle: cycle,
      monthly_price: monthlyPrice,
      total_price: totalPrice,
      end_date: endDate.toISOString(),
    });

    // Create payment record
    await supabase.from('payments').insert({
      user_id: user.id,
      amount: totalPrice,
      status: 'completed',
      payment_method: 'simulation',
    });

    // Add credits to user account
    await supabase
      .from('users')
      .update({ credits: credits })
      .eq('id', user.id);

    setProcessing(false);
    router.push('/dashboard/stock/order-v2?success=true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Complete Your Purchase</h1>

          {/* Order Summary */}
          <div className="mb-8 p-6 bg-white/5 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
            <div className="space-y-2 text-white/70">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="text-white capitalize">{plan}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Cycle:</span>
                <span className="text-white">{cycle} month(s)</span>
              </div>
              <div className="flex justify-between">
                <span>Credits:</span>
                <span className="text-white">{credits} total</span>
              </div>
              <div className="flex justify-between">
                <span>Price per month:</span>
                <span className="text-white">${monthlyPrice.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/20 mt-4 pt-4 flex justify-between text-lg font-semibold">
                <span className="text-white">Total:</span>
                <span className="text-green-400">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form (Simulation) */}
          <div className="space-y-4">
            <div>
              <label className="block text-white/90 mb-2 text-sm font-medium">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/90 mb-2 text-sm font-medium">Expiry Date</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-white/90 mb-2 text-sm font-medium">CVV</label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="123"
                  maxLength={3}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 text-sm">
                ⚠️ This is a simulated payment. No real charges will be made.
              </p>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full mt-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-all"
            >
              {processing ? 'Processing...' : `Pay $${totalPrice.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
