'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { validatePassword, validateEmail } from '@/lib/validators';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validationError = validatePassword(value);
    setPasswordError(validationError || '');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    // Validate password
    const passError = validatePassword(password);
    if (passError) {
      setPasswordError(passError);
      return;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const pendingPurchase = localStorage.getItem('pendingPurchase');
    
    if (pendingPurchase && data.user) {
      const purchase = JSON.parse(pendingPurchase);
      localStorage.removeItem('pendingPurchase');
      
      router.push(
        `/payment?plan=${purchase.plan}&cycle=${purchase.cycle}&totalPrice=${purchase.totalPrice}&credits=${purchase.credits}`
      );
    } else {
      router.push('/dashboard/stock/order-v2');
    }

    setLoading(false);
  };

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[@$!%*?&]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h1>
        <p className="text-white/70 text-center mb-8">Sign up to start downloading premium stock images</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-white/90 mb-2 text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white/90 mb-2 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onFocus={() => setShowPasswordHints(true)}
              required
              className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                passwordError ? 'border-red-500' : 'border-white/10'
              } text-white placeholder-white/40 focus:outline-none focus:border-purple-500`}
              placeholder="••••••••"
            />
            
            {/* Password Error */}
            {passwordError && (
              <p className="mt-2 text-red-400 text-xs">{passwordError}</p>
            )}

            {/* Password Strength Indicator */}
            {showPasswordHints && password && (
              <div className="mt-3">
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength >= level
                          ? passwordStrength <= 2
                            ? 'bg-red-500'
                            : passwordStrength === 3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Password Requirements Checklist */}
                <div className="space-y-1">
                  <div className={`text-xs flex items-center gap-2 ${password.length >= 8 ? 'text-green-400' : 'text-white/50'}`}>
                    <span>{password.length >= 8 ? '✓' : '○'}</span>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`text-xs flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-400' : 'text-white/50'}`}>
                    <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`text-xs flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-white/50'}`}>
                    <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`text-xs flex items-center gap-2 ${/\d/.test(password) ? 'text-green-400' : 'text-white/50'}`}>
                    <span>{/\d/.test(password) ? '✓' : '○'}</span>
                    <span>One number</span>
                  </div>
                  <div className={`text-xs flex items-center gap-2 ${/[@$!%*?&]/.test(password) ? 'text-green-400' : 'text-white/50'}`}>
                    <span>{/[@$!%*?&]/.test(password) ? '✓' : '○'}</span>
                    <span>One special character (@$!%*?&)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-white/90 mb-2 text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!passwordError}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-all"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-white/60 text-center mt-6 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
