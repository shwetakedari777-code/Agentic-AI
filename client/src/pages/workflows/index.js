import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  GitBranch,
  Plus,
  Search,
  Sparkles,
  Play,
  Copy,
  Trash2,
  ExternalLink,
  Tag,
  Filter,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import api from '../../services/api';

export default function WorkflowsListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/workflows', {
        params: { search, status: statusFilter },
      });
      if (res.data?.workflows) {
        setWorkflows(res.data.workflows);
      }
    } catch (err) {
      console.warn('Failed to load workflows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, [search, statusFilter]);

  const handleCreateBlank = async () => {
    try {
      const res = await api.post('/workflows', {
        name: 'New Custom Automation',
        description: 'Drag and connect integration steps on the canvas',
        nodes: [
          {
            id: 'node-trigger-1',
            type: 'triggerNode',
            position: { x: 150, y: 200 },
            data: { label: 'Manual Trigger', action: 'manual_trigger', config: {} },
          },
        ],
        edges: [],
      });
      if (res.data?.data?._id) {
        router.push(`/workflows/${res.data.data._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create workflow');
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/workflows/${id}/duplicate`);
      loadWorkflows();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to duplicate workflow');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      loadWorkflows();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete workflow');
    }
  };

  const handleExecute = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/workflows/${id}/execute`, {});
      if (res.data?.data?.executionId) {
        router.push(`/executions/${res.data.data.executionId}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to execute workflow');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Workflow Library">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Automated Workflows
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage visual flow graphs, version history, and triggered executions
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/workflows/builder"
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Prompt Generator</span>
              </Link>
              <button
                onClick={handleCreateBlank}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Blank Canvas</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[#0c1222] border border-slate-800/80">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search workflows by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* Workflows Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="p-12 text-center bg-[#0c1222] border border-slate-800 rounded-xl space-y-3">
              <GitBranch className="w-10 h-10 mx-auto text-slate-400" />
              <h3 className="text-sm font-semibold text-white">No workflows found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Generate an automation with AI from natural language or create a fresh visual canvas.
              </p>
              <div className="pt-2">
                <Link
                  href="/workflows/builder"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Workflow</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <div
                  key={wf._id}
                  onClick={() => router.push(`/workflows/${wf._id}`)}
                  className="p-5 rounded-xl bg-[#0c1222] hover:bg-slate-850/80 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                        v{wf.version || 1} • {wf.status || 'draft'}
                      </span>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleExecute(wf._id, e)}
                          title="Execute on demand"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDuplicate(wf._id, e)}
                          title="Duplicate"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(wf._id, e)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {wf.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <GitBranch className="w-3 h-3 text-indigo-400" />
                      {wf.nodes?.length || 0} node(s)
                    </span>
                    <span>{new Date(wf.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
