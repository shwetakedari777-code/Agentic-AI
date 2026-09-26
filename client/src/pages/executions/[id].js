import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Pause,
  Play,
  XCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Terminal,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';
import socketService from '../../services/socket';

export default function ExecutionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { setWorkflow } = useWorkflowStore();
  const [execution, setExecution] = useState(null);
  const [timelineLogs, setTimelineLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch initial execution and timeline
  const loadExecutionData = async () => {
    if (!id) return;
    try {
      const [execRes, timeRes] = await Promise.all([
        api.get(`/executions/${id}`),
        api.get(`/executions/${id}/timeline`),
      ]);

      if (execRes.data?.data) {
        const exec = execRes.data.data;
        setExecution(exec);

        // Load snapshot graph onto canvas with execution status markers
        if (exec.workflowSnapshot) {
          const snapshotNodes = (exec.workflowSnapshot.nodes || []).map((node) => {
            let status = 'idle';
            if (exec.currentNode === node.id && (exec.status === 'RUNNING' || exec.status === 'RETRYING')) {
              status = 'running';
            } else if (exec.outputs && exec.outputs[node.id]) {
              status = 'success';
            } else if (exec.error && exec.error.nodeId === node.id) {
              status = 'failed';
            }
            return {
              ...node,
              data: {
                ...node.data,
                executionStatus: status,
              },
            };
          });

          setWorkflow({
            ...exec.workflowSnapshot,
            nodes: snapshotNodes,
          });
        }
      }

      if (timeRes.data?.data) {
        setTimelineLogs(timeRes.data.data);
      }
    } catch (err) {
      console.warn('Execution fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadExecutionData();

    // Socket.IO Room Joining & Real-Time Event Subscriptions
    socketService.joinExecutionRoom(id);

    const handleLog = (logItem) => {
      setTimelineLogs((prev) => [...prev, logItem]);
    };

    const handleStatus = (statusUpdate) => {
      setExecution((prev) => (prev ? { ...prev, ...statusUpdate } : null));
      loadExecutionData(); // re-sync nodes
    };

    socketService.on('execution:log', handleLog);
    socketService.on('execution:status', handleStatus);

    return () => {
      socketService.leaveExecutionRoom(id);
      socketService.off('execution:log', handleLog);
      socketService.off('execution:status', handleStatus);
    };
  }, [id]);

  // Controls: Pause, Resume, Cancel
  const handlePause = async () => {
    setIsActionLoading(true);
    try {
      await api.post(`/executions/${id}/pause`);
      loadExecutionData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to pause');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResume = async () => {
    setIsActionLoading(true);
    try {
      await api.post(`/executions/${id}/resume`);
      loadExecutionData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resume');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this execution?')) return;
    setIsActionLoading(true);
    try {
      await api.post(`/executions/${id}/cancel`);
      loadExecutionData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getAgentBadgeColor = (agent) => {
    switch (agent) {
      case 'planner':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'execution':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'validation':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'recovery':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'monitoring':
      default:
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title={`Run: ${id ? String(id).slice(-8) : ''}`}>
        <div className="flex flex-col h-full bg-[#060a14] overflow-hidden">
          {/* Top Control Bar */}
          <div className="h-14 bg-[#0a0f1d] border-b border-slate-800 px-4 flex items-center justify-between z-10 shadow-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/executions')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Back to executions"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-slate-800" />

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {execution?.workflowSnapshot?.name || 'Automation Flow'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  ID: {String(id).slice(-8)}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    execution?.status === 'COMPLETED'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : execution?.status === 'FAILED'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : execution?.status === 'PAUSED'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 animate-pulse'
                  }`}
                >
                  {execution?.status || 'PENDING'}
                </span>
                {execution?.duration > 0 && (
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {execution.duration}ms
                  </span>
                )}
              </div>
            </div>

            {/* Lifecycle Control Buttons */}
            <div className="flex items-center gap-2">
              {execution?.status === 'RUNNING' && (
                <button
                  onClick={handlePause}
                  disabled={isActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-semibold transition-all"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Run</span>
                </button>
              )}

              {execution?.status === 'PAUSED' && (
                <button
                  onClick={handleResume}
                  disabled={isActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Run</span>
                </button>
              )}

              {['RUNNING', 'PAUSED', 'RETRYING'].includes(execution?.status) && (
                <button
                  onClick={handleCancel}
                  disabled={isActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Run</span>
                </button>
              )}
            </div>
          </div>

          {/* Body: Split View (Canvas Top/Left + Live Agent Timeline Right/Bottom) */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Live Interactive Graph Canvas */}
            <div className="flex-1 h-1/2 lg:h-full relative border-b lg:border-b-0 lg:border-r border-slate-800">
              <WorkflowCanvas readOnly={true} />
            </div>

            {/* Live Agent Timeline & Telemetry Inspector */}
            <div className="w-full lg:w-96 h-1/2 lg:h-full bg-[#0a0f1d] flex flex-col overflow-hidden">
              {/* Timeline Header */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Agent Timeline
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {timelineLogs.length} events logged
                </span>
              </div>

              {/* Timeline Event Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {timelineLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Waiting for agent events...
                  </div>
                ) : (
                  timelineLogs.map((log, idx) => {
                    const isSelected = selectedLog === log;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedLog(isSelected ? null : log)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-slate-800 border-indigo-500/50'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${getAgentBadgeColor(
                              log.agent
                            )}`}
                          >
                            {log.agent}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed font-sans">{log.message}</p>

                        {/* Inspector Expand */}
                        {isSelected && log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-700/80">
                            <span className="text-[10px] font-mono text-slate-400 block mb-1">
                              METADATA PAYLOAD:
                            </span>
                            <pre className="p-2 rounded bg-slate-950 text-[10px] text-indigo-300 font-mono overflow-x-auto max-h-40">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
