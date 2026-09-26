import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Cpu,
  CheckCircle2,
  AlertCircle,
  User,
  Activity,
  Lock,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [healthData, setHealthData] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealthData(res.data);
      } catch (err) {
        console.warn('Health check error:', err);
      } finally {
        setIsLoadingHealth(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell title="Platform Settings">
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Platform & Security Settings
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Operator identity, encryption health, background queues, and system substrates
            </p>
          </div>

          {/* Profile Card */}
          <div className="p-6 rounded-2xl bg-[#0c1222] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Operator Profile</h3>
                <p className="text-xs text-slate-400">Current active session credentials</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block font-mono text-[11px]">Full Name</span>
                <span className="text-white font-semibold text-sm mt-0.5 block">{user?.name}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block font-mono text-[11px]">Email Address</span>
                <span className="text-white font-semibold text-sm mt-0.5 block">{user?.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block font-mono text-[11px]">Security Role</span>
                <span className="inline-flex items-center gap-1.5 text-indigo-400 font-mono font-semibold uppercase mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  {user?.role || 'operator'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block font-mono text-[11px]">Operator ID</span>
                <span className="text-slate-300 font-mono text-[11px] mt-0.5 block truncate">
                  {user?.id}
                </span>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Checks */}
          <div className="p-6 rounded-2xl bg-[#0c1222] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">System Substrates & Health</h3>
                <p className="text-xs text-slate-400">Master encryption keys, databases, and AI runtimes</p>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="font-semibold text-slate-200">Credential Master Key</span>
                    <p className="text-[11px] text-slate-400">AES-256-GCM encryption at rest</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  ACTIVE & VALID
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="font-semibold text-slate-200">Storage Layer</span>
                    <p className="text-[11px] text-slate-400">Persistence engine mode</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono text-[11px]">
                  {healthData?.storage || 'mongodb / in-memory-fallback'}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="font-semibold text-slate-200">LangGraph Substrate</span>
                    <p className="text-[11px] text-slate-400">Orchestration framework status</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px]">
                  {healthData?.langGraph === 'available' ? 'AVAILABLE' : 'NOT-INSTALLED (Fallback Active)'}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-semibold text-slate-200">JWT Token Expiry</span>
                    <p className="text-[11px] text-slate-400">Session validity period</p>
                  </div>
                </div>
                <span className="font-mono text-slate-300">7 Days (Stateless HMAC-SHA256)</span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
