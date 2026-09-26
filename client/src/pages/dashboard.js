import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Sparkles,
  GitBranch,
  Play,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Plus,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import MetricGrid from '../components/MetricGrid/MetricGrid';
import api from '../services/api';
import socketService from '../services/socket';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveLogs, setLiveLogs] = useState([]);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/workflows/dashboard');
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    // Listen to real-time agent event stream
    const handleLiveEvent = (event) => {
      if (event?.data) {
        setLiveLogs((prev) => [event.data, ...prev.slice(0, 15)]);
      }
    };

    socketService.on('execution:log', handleLiveEvent);
    socketService.on('execution:event', handleLiveEvent);

    return () => {
      socketService.off('execution:log', handleLiveEvent);
      socketService.off('execution:event', handleLiveEvent);
    };
  }, []);

  const handleQuickRun = async (workflowId, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/workflows/${workflowId}/execute`, {});
      if (res.data?.data?.executionId) {
        router.push(`/executions/${res.data.data.executionId}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to trigger run');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Operations Dashboard">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header & Quick Action Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Automation Cluster Overview
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time multi-agent orchestration metrics and execution timelines
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadDashboard}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Refresh stats"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <Link
                href="/workflows/builder"
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prompt to Workflow</span>
              </Link>
            </div>
          </div>

          {/* Metric Grid */}
          <MetricGrid metrics={data?.metrics || {}} />

          {/* Two Columns: Recent Executions & Live Agent Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Executions (2 Cols) */}
            <div className="lg:col-span-2 bg-[#0c1222] border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">Recent Execution Runs</h3>
                  </div>
                  <Link
                    href="/executions"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <span>View all</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                        <th className="pb-2.5 font-medium">Status</th>
                        <th className="pb-2.5 font-medium">Workflow</th>
                        <th className="pb-2.5 font-medium">Trigger</th>
                        <th className="pb-2.5 font-medium">Duration</th>
                        <th className="pb-2.5 font-medium">Started</th>
                        <th className="pb-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data?.recentExecutions && data.recentExecutions.length > 0 ? (
                        data.recentExecutions.map((exec) => {
                          const isDone = exec.status === 'COMPLETED';
                          const isFail = exec.status === 'FAILED';
                          const isRun = exec.status === 'RUNNING' || exec.status === 'RETRYING';

                          return (
                            <tr
                              key={exec._id || exec.id}
                              onClick={() => router.push(`/executions/${exec._id || exec.id}`)}
                              className="hover:bg-slate-850/50 cursor-pointer transition-colors"
                            >
                              <td className="py-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                                    isDone
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : isFail
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      : isRun
                                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {isDone && <CheckCircle2 className="w-3 h-3" />}
                                  {isFail && <AlertCircle className="w-3 h-3" />}
                                  {isRun && <RefreshCw className="w-3 h-3 animate-spin" />}
                                  {exec.status}
                                </span>
                              </td>
                              <td className="py-3 font-medium text-slate-200">
                                {exec.workflowSnapshot?.name || 'Automation Flow'}
                              </td>
                              <td className="py-3 text-slate-400 font-mono text-[11px]">
                                {exec.triggerType || 'manual'}
                              </td>
                              <td className="py-3 text-slate-400 font-mono text-[11px]">
                                {exec.duration ? `${exec.duration}ms` : '—'}
                              </td>
                              <td className="py-3 text-slate-400 text-[11px]">
                                {new Date(exec.startTime).toLocaleTimeString()}
                              </td>
                              <td className="py-3 text-right">
                                <span className="text-indigo-400 hover:text-indigo-300 text-xs font-medium">
                                  Timeline &rarr;
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No executions logged yet. Run a workflow to populate this timeline.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Live Agent Stream (1 Col) */}
            <div className="bg-[#0c1222] border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col h-[380px]">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Live Agent Telemetry</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  STREAMING
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-1">
                {liveLogs.length > 0 ? (
                  liveLogs.map((log, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-slate-900/80 border border-slate-800/80 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-400 font-bold uppercase text-[9px]">
                          [{log.agent || 'SYSTEM'}]
                        </span>
                        <span className="text-slate-400 text-[9px]">
                          {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans leading-relaxed">{log.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-sans text-center px-4">
                    <Activity className="w-6 h-6 mb-2 text-slate-400" />
                    <p>Agent event stream listening...</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Trigger an execution to observe real-time multi-agent cooperation
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Access Workflows */}
          <div className="bg-[#0c1222] border border-slate-800/80 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Production Workflows</h3>
              </div>
              <Link
                href="/workflows"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>All Workflows</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.recentWorkflows && data.recentWorkflows.length > 0 ? (
                data.recentWorkflows.map((wf) => (
                  <div
                    key={wf._id}
                    onClick={() => router.push(`/workflows/${wf._id}`)}
                    className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          v{wf.version || 1} • {wf.status || 'draft'}
                        </span>
                        <button
                          onClick={(e) => handleQuickRun(wf._id, e)}
                          title="Execute on demand"
                          className="p-1.5 rounded-md bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-colors"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                        {wf.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {wf.description || 'No description configured.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{wf.nodes?.length || 0} nodes</span>
                      <span>{new Date(wf.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  No workflows created yet. Click &apos;Prompt to Workflow&apos; above to generate your first automation.
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
