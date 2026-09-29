import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { FaAtom, FaLock, FaEnvelope, FaUser, FaEye, FaEyeSlash, FaArrowRight } from 'react-icons/fa';

export const QxLabsAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const isSignupInit = location.pathname.includes('signup');
  const [isSignup, setIsSignup] = useState(isSignupInit);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleQuickDemoLogin = async () => {
    setEmail('demo@qxlabs.ai');
    setPassword('quantum123');
    setLoading(true);
    try {
      const authPromise = login('demo@qxlabs.ai', 'quantum123');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out. Please check backend server.')), 7500)
      );
      await Promise.race([authPromise, timeoutPromise]);
      toast.success('Signed in as Quantum Explorer!');
      navigate('/playground');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    if (isSignup && !fullName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const authPromise = isSignup
        ? register(email, password, fullName)
        : login(email, password);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out. Please check backend server or use demo account.')), 7500)
      );

      await Promise.race([authPromise, timeoutPromise]);
      toast.success(isSignup ? 'Account created successfully! Welcome to QxLabs.' : 'Welcome back to QxLabs!');
      navigate('/playground');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-zinc-900 flex flex-col justify-between font-sans selection:bg-zinc-200">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
            <FaAtom className="text-white text-base" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-zinc-950">
              QxLabs
            </span>
          </div>
        </Link>
        <Link
          to="/"
          className="text-xs text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-1.5"
        >
          Back to Overview <FaArrowRight className="text-[10px]" />
        </Link>
      </header>

      {/* Form Card */}
      <main className="w-full max-w-md mx-auto px-6 py-8">
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-sm">
          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-zinc-950 tracking-tight">
              {isSignup ? 'Create your QxLabs Account' : 'Sign in to QxLabs'}
            </h1>
            <p className="text-xs text-zinc-500 mt-2">
              {isSignup
                ? 'Join the high-performance quantum computing environment'
                : 'Access your quantum circuits, hardware jobs, and Bloch tasks'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-full mb-6">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                !isSignup
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                isSignup
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Erwin Schrödinger"
                    className="w-full bg-[#f9f9fb] border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="physicist@quantum.org"
                  className="w-full bg-[#f9f9fb] border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f9f9fb] border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Passwords are encrypted using PBKDF2 HMAC SHA-256 with salted key derivation.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-tight transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaAtom className="animate-spin text-sm" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isSignup ? 'Create QxLabs Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Quick Demo Access Note */}
          <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-col gap-2.5 text-center">
            <button
              type="button"
              disabled={loading}
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 text-xs font-medium transition-all active:scale-[0.98] shadow-2xs disabled:opacity-50"
            >
              Sign In with Demo Explorer Account
            </button>
            <p className="text-[11px] text-zinc-500">
              Preset demo: <code className="font-mono text-zinc-700">demo@qxlabs.ai</code> / <code className="font-mono text-zinc-700">quantum123</code>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-zinc-500">
        <span className="font-semibold text-zinc-800">QxLabs</span> — High-Performance Quantum Learning Sandbox · © 2026 copyrighted all rights reserved
      </footer>
    </div>
  );
};
