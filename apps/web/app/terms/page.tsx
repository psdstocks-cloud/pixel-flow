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
                By accessing and using Pixel Flow (&quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Permission is granted to temporarily download one copy of the materials on Pixel Flow&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Under this license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 my-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on Pixel Flow&apos;s website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Account Terms</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You must be 13 years or older to use this Service. You are responsible for maintaining the security of your account and password. Pixel Flow cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Payment Terms</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis. Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select.
              </p>
              <p className="text-gray-300 leading-relaxed">
                All fees are exclusive of all taxes, levies, or duties imposed by taxing authorities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Cancellation and Refunds</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You can cancel your subscription at any time. Upon cancellation, you will have access to the Service until the end of your current billing period.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Refunds are handled on a case-by-case basis. Please contact support for refund requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Prohibited Uses</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You may not use the Service:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 my-4">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, provincial or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed">
                In no event shall Pixel Flow or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Pixel Flow&apos;s website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Modifications</h2>
              <p className="text-gray-300 leading-relaxed">
                Pixel Flow may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the current version of these terms of service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Information</h2>
              <p className="text-gray-300 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white font-medium">Email: support@pixelflow.com</p>
                <p className="text-gray-300 mt-2">Address: Your Business Address</p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 flex flex-wrap gap-6 justify-center text-sm">
          <Link href="/privacy" className="text-purple-400 hover:text-purple-300 transition">
            Privacy Policy
          </Link>
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition">
            Home
          </Link>
          <Link href="/contact" className="text-purple-400 hover:text-purple-300 transition">
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Terms of Service - Pixel Flow',
  description: 'Terms of Service for Pixel Flow stock image platform',
};
