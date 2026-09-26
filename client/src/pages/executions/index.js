import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Filter,
  ArrowRight,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import api from '../../services/api';
import socketService from '../../services/socket';

export default function ExecutionsListPage() {
  const router = useRouter();
  const [executions, setExecutions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadExecutions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/executions', {
        params: { status: statusFilter },
      });
      if (res.data?.executions) {
        setExecutions(res.data.executions);
      }
    } catch (err) {
      console.warn('Failed to load executions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExecutions();

    // Real-time status update handler
    const handleStatusUpdate = (update) => {
      setExecutions((prev) =>
        prev.map((e) =>
          e._id === update.executionId ? { ...e, status: update.status, duration: update.duration || e.duration } : e
        )
      );
    };

    socketService.on('execution:status', handleStatusUpdate);
    return () => {
      socketService.off('execution:status', handleStatusUpdate);
    };
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COMPLETED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            FAILED
          </span>
        );
      case 'RUNNING':
      case 'RETRYING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            {status}
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <PauseCircle className="w-3.5 h-3.5" />
            PAUSED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3.5 h-3.5" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Execution History & Runs">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Execution Audit Trail
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Every automation run with agent telemetry, durations, retries, and errors
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="RUNNING">RUNNING</option>
                <option value="FAILED">FAILED</option>
                <option value="PAUSED">PAUSED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0c1222] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Workflow</th>
                    <th className="py-3 px-4 font-medium">Trigger Mode</th>
                    <th className="py-3 px-4 font-medium">Duration</th>
                    <th className="py-3 px-4 font-medium">Retries</th>
                    <th className="py-3 px-4 font-medium">Started At</th>
                    <th className="py-3 px-4 font-medium text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading execution runs...
                      </td>
                    </tr>
                  ) : executions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No executions matching criteria.
                      </td>
                    </tr>
                  ) : (
                    executions.map((exec) => (
                      <tr
                        key={exec._id || exec.id}
                        onClick={() => router.push(`/executions/${exec._id || exec.id}`)}
                        className="hover:bg-slate-850/60 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4">{getStatusBadge(exec.status)}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-100">
                          {exec.workflowSnapshot?.name || 'Automation Flow'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {exec.triggerType || 'manual'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {exec.duration ? `${exec.duration}ms` : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {exec.retryCount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(exec.startTime).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium">
                            Live Inspector <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
