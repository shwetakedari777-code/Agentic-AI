import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Save,
  Play,
  Copy,
  ArrowLeft,
  GitBranch,
  Layers,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import NodePalette from '../../components/NodePalette/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    activeWorkflow,
    setWorkflow,
    isDirty,
    isSaving,
    isExecuting,
    saveWorkflow,
    executeWorkflow,
    nodes,
    edges,
  } = useWorkflowStore();

  const [isLoading, setIsLoading] = useState(true);
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchWorkflow = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/workflows/${id}`);
        if (res.data?.data) {
          setWorkflow(res.data.data);
          setWorkflowTitle(res.data.data.name);
        }
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to load workflow');
        router.push('/workflows');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflow();
  }, [id, setWorkflow, router]);

  const handleSave = async () => {
    const res = await saveWorkflow();
    if (res?.success) {
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 2500);
    }
  };

  const handleExecute = async () => {
    const res = await executeWorkflow({});
    if (res?.success && res.executionId) {
      router.push(`/executions/${res.executionId}`);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await api.post(`/workflows/${id}/duplicate`);
      if (res.data?.data?._id) {
        router.push(`/workflows/${res.data.data._id}`);
      }
    } catch (err) {
      alert('Failed to duplicate workflow');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title={workflowTitle || 'Canvas Studio'}>
        <div className="flex flex-col h-full bg-[#060a14] overflow-hidden">
          {/* Top Canvas Toolbar */}
          <div className="h-14 bg-[#0a0f1d] border-b border-slate-800 px-4 flex items-center justify-between z-10 select-none shadow-md">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/workflows')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Back to Workflows"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-slate-800" />

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={workflowTitle}
                  onChange={(e) => {
                    setWorkflowTitle(e.target.value);
                    if (activeWorkflow) activeWorkflow.name = e.target.value;
                  }}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none focus:bg-slate-900 px-2 py-1 rounded border border-transparent focus:border-slate-700 transition-colors"
                />

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v{activeWorkflow?.version || 1}
                </span>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {nodes.length} nodes • {edges.length} edges
                </span>

                {isDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {saveSuccessMsg && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}

              <button
                onClick={handleDuplicate}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                title="Clone Workflow"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isDirty
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Flow'}</span>
              </button>

              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isExecuting ? 'Starting...' : 'Execute'}</span>
              </button>
            </div>
          </div>

          {/* Canvas Workspace: Left Palette + Center Flow + Right Config */}
          <div className="flex-1 flex overflow-hidden relative">
            <NodePalette />
            <div className="flex-1 h-full relative">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  Loading canvas graph...
                </div>
              ) : (
                <WorkflowCanvas />
              )}
            </div>
            <NodeConfigPanel />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
