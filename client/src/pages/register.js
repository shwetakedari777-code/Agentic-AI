import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Activity, Lock, Mail, User, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await register({ name, email, password, role });
    if (result.success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#060a14] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] right-[30%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px]" />
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
          Create Operator Account
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Register new credentials to deploy autonomous agent pipelines
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
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Connor"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@company.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Operator Role
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="operator">Operator (Workflows & Executions)</option>
                  <option value="admin">Administrator (Full Control)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link href="/login" className="text-indigo-400 hover:underline font-medium">
              Sign in to console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
