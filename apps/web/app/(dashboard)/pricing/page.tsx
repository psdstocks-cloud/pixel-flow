'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Package {
  id: string;
  name: string;
  description: string;
  points: number;
  price: number;
  isPopular: boolean;
  features: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pixel-flow-api-production.up.railway.app';
const USER_ID = 'cm2rb9yio00008il2t2x91euo'; // Hardcoded for now

export default function PricingPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/packages`);
      const data = await response.json();
      if (data.success) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
  setPurchasing(packageId);
  try {
    const response = await fetch(`${API_URL}/api/packages/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': USER_ID,
      },
      body: JSON.stringify({ packageId }),
    });

    const data = await response.json();

    if (data.success) {
      alert(`✅ ${data.message}\nNew Balance: ${data.newBalance} points`);
      router.push('/stock/order-v2');
    } else {
      alert('❌ ' + (data.error || 'Purchase failed'));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Purchase failed';
    alert('❌ ' + message);
  } finally {
    setPurchasing(null);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-gray-900 to-black">
        <div className="text-white text-xl">Loading packages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-300">Download stock assets from 10+ platforms instantly</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative backdrop-blur-xl rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
                pkg.isPopular
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500'
                  : 'bg-white/10 border-white/20 hover:border-purple-500/50'
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{pkg.description}</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-white">${pkg.price}</span>
                </div>
                <div className="text-purple-400 font-semibold text-lg">
                  {pkg.points} Download Points
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing === pkg.id}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  pkg.isPopular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {purchasing === pkg.id ? 'Processing...' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6 text-gray-300">
              <div>
                <div className="text-4xl mb-2">💳</div>
                <h4 className="font-bold text-white mb-2">1. Buy Points</h4>
                <p className="text-sm">Choose a package and get instant points</p>
              </div>
              <div>
                <div className="text-4xl mb-2">🔗</div>
                <h4 className="font-bold text-white mb-2">2. Paste URLs</h4>
                <p className="text-sm">Add up to 5 stock asset URLs at once</p>
              </div>
              <div>
                <div className="text-4xl mb-2">⬇️</div>
                <h4 className="font-bold text-white mb-2">3. Download</h4>
                <p className="text-sm">Get your files instantly, no watermarks</p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-gray-400">💡 Free credits for testing • Full Stripe integration coming soon</p>
        </div>
      </div>
    </div>
  );
}
