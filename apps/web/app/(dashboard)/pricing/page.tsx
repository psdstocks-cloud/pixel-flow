'use client';

import { useEffect, useState } from 'react';

// ✅ Define a proper TypeScript interface for Package
interface Package {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  credits?: number;
  features?: string[];
}

export default function PricingPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        
        // ✅ Use the environment variable
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setPackages(data.data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch packages:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch packages');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) return <div>Loading packages...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
      <p className="text-center text-gray-600 mb-8">
        Download stock assets from 10+ platforms instantly
      </p>

      {/* ✅ NOW USING THE PACKAGES VARIABLE WITH PROPER TYPING */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No packages available at the moment.</p>
          </div>
        ) : (
          packages.map((pkg: Package, index: number) => (
            <div 
              key={pkg.id || index} 
              className="border rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 className="text-2xl font-bold mb-2">{pkg.name || 'Package'}</h3>
              <p className="text-gray-600 mb-4">{pkg.description || 'No description'}</p>
              <div className="text-3xl font-bold mb-4">
                ${pkg.price || '0'}
                <span className="text-sm text-gray-500 font-normal">/month</span>
              </div>
              {pkg.credits && (
                <p className="text-sm text-gray-600 mb-4">{pkg.credits} credits</p>
              )}
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </div>
          ))
        )}
      </div>

      {/* Your existing static pricing UI (if you have one, keep it below) */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-6">How It Works</h2>
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            <span className="text-2xl font-bold text-blue-600">1.</span>
            <div>
              <h3 className="font-bold">Buy Points</h3>
              <p className="text-gray-600">Choose a package and get instant points</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-2xl font-bold text-blue-600">2.</span>
            <div>
              <h3 className="font-bold">Paste URLs</h3>
              <p className="text-gray-600">Add up to 5 stock asset URLs at once</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-2xl font-bold text-blue-600">3.</span>
            <div>
              <h3 className="font-bold">Download</h3>
              <p className="text-gray-600">Get your files instantly, no watermarks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
