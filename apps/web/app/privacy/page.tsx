import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-300 text-lg">Last updated: October 23, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/10">
          <div className="prose prose-invert prose-purple max-w-none">
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 my-4">
                <li>Account information (name, email address, password)</li>
                <li>Payment information (processed securely through our payment providers)</li>
                <li>Profile information and preferences</li>
                <li>Communications with us</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 my-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Provide personalized content and features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Information Sharing</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 my-4">
                <li><strong className="text-white">Service Providers:</strong> Third-party companies that help us provide our services (hosting, analytics, payment processing)</li>
                <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Cookies and Tracking</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 my-4">
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our service</li>
                <li>Improve and personalize your experience</li>
                <li>Analyze site performance and traffic</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                You can control cookies through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
              <p className="text-gray-300 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 my-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
              <p className="text-gray-300 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Children's Privacy</h2>
              <p className="text-gray-300 leading-relaxed">
                Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. International Data Transfers</h2>
              <p className="text-gray-300 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white font-medium">Email: privacy@pixelflow.com</p>
                <p className="text-gray-300 mt-2">Address: Your Business Address</p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 flex flex-wrap gap-6 justify-center text-sm">
          <Link href="/terms" className="text-purple-400 hover:text-purple-300 transition">
            Terms of Service
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
  title: 'Privacy Policy - Pixel Flow',
  description: 'Privacy Policy for Pixel Flow stock image platform',
};
