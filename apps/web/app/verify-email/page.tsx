/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('pending-email', emailParam);
    } else {
      const storedEmail = localStorage.getItem('pending-email');
      if (storedEmail) setEmail(storedEmail);
    }
  }, []);

  const handleResendEmail = async () => {
    alert('Verification email resent! Check your inbox.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Pixel Flow</h1>
          <p className="text-gray-300">Verify your email address</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Check your email
          </h2>
          
          {email && (
            <p className="text-center text-gray-300 mb-6">
              We sent a verification link to
              <br />
              <span className="font-semibold text-purple-400">{email}</span>
            </p>
          )}

          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-300">
              <strong>Next steps:</strong>
              <br />
              1. Check your email inbox
              <br />
              2. Click the verification link
              <br />
              3. You will be redirected to login
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-300">
              <strong>Did not receive the email?</strong>
              <br />
              • Check your spam folder
              <br />
              • Make sure you entered the correct email
              <br />
              • Wait a few minutes and try again
            </p>
          </div>

          <div className="space-y-3">
            <button onClick={handleResendEmail} className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
              Resend verification email
            </button>

            <Link href="/login" className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-center transition">
              Back to Login
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Need help?{' '}
            <Link href="/contact" className="text-purple-400 hover:text-purple-300">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
