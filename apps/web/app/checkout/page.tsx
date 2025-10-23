'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/login?redirect=/checkout?plan=${planId}`);
        return;
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [planId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
        <div className="text-white">Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6">Complete Your Purchase</h1>
          <p className="text-gray-300 mb-8">
            Plan: {planId} - Payment integration coming soon with Stripe!
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
            <p className="text-yellow-300">
              Payment processing will be integrated in Week 2 with Stripe or other payment gateway.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
