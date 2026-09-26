import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Activity, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login({ email, password });
    if (result.success) {
      router.push('/dashboard');
    }
  };

  const handleFillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-[#060a14] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-[#0a0f1d] rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <span className="font-bold text-xl text-white tracking-tight">
            Agentflow<span className="text-xs px-2 py-0.5 ml-1 rounded bg-indigo-500/20 text-indigo-400 font-mono">AI</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-white tracking-tight">
          Operator Console Sign In
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Enter your operator credentials to access the automation cluster
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#0b1020] py-8 px-6 sm:px-8 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Operator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@agentflow.ai"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Fill Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2.5 font-mono">
              Quick Dev Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@agentflow.ai')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-indigo-300 font-mono transition-colors"
              >
                Admin Mode
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('operator@agentflow.ai')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-cyan-300 font-mono transition-colors"
              >
                Operator Mode
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:underline font-medium">
              Create operator profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
