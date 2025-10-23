/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/" 
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-300 text-lg">Last updated: October 23, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/10">
          <div className="prose prose-invert prose-purple max-w-none">
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                By accessing and using Pixel Flow (Service), you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Permission is granted to temporarily download materials on Pixel Flow website for personal, non-commercial viewing only.
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 my-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Remove any copyright or proprietary notations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Contact Information</h2>
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white font-medium">Email: support@pixelflow.com</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Terms of Service - Pixel Flow',
  description: 'Terms of Service for Pixel Flow',
};
