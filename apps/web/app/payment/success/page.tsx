'use client'

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const credits = searchParams.get('credits') || '0';
  const [countdown, setCountdown] = useState(5);
  const [nextPaymentDate, setNextPaymentDate] = useState('');

  useEffect(() => {
    fetchNextPayment();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard/stock/order-v2');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const fetchNextPayment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('end_date')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .limit(1)
      .single();

    if (subscription?.end_date) {
      const date = new Date(subscription.end_date);
      setNextPaymentDate(date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Payment Successful!
        </h1>

        <p className="text-white/80 mb-6">
          Your payment has been processed successfully.
        </p>

        {/* Credits Added */}
        <div className="mb-6 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl">
          <div className="text-white/70 text-sm mb-2">Credits Added</div>
          <div className="text-5xl font-bold text-green-400">
            +{credits}
          </div>
          <div className="text-white/60 text-sm mt-2">credits</div>
        </div>

        {/* Next Payment Date */}
        {nextPaymentDate && (
          <div className="mb-8 p-4 bg-white/5 rounded-lg">
            <div className="text-white/70 text-sm">Subscription expires on</div>
            <div className="text-white font-semibold">{nextPaymentDate}</div>
          </div>
        )}

        {/* Auto-redirect notice */}
        <p className="text-white/60 text-sm mb-4">
          Redirecting to dashboard in <span className="font-bold text-white">{countdown}</span> seconds...
        </p>

        <button
          onClick={() => router.push('/dashboard/stock/order-v2')}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
