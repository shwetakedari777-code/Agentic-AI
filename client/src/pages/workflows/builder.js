import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Sparkles,
  Play,
  Save,
  Wand2,
  Cpu,
  Layers,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';

export default function AIWorkflowBuilderPage() {
  const router = useRouter();
  const setWorkflow = useWorkflowStore((state) => state.setWorkflow);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState(null);
  const [engineUsed, setEngineUsed] = useState(null);

  const promptSuggestions = [
    'When customer support email arrives, summarize sentiment, alert Slack #ops-alerts, and append lead row to Google Sheets.',
    'Invoice processing: parse incoming billing email, notify Discord ops-feed, and record line item in Google Sheets.',
    'New user registration webhook: dispatch Gmail welcome sequence, append to customer CRM sheet, and alert Slack channel.',
    'Critical system incident alert: post urgent embed to Discord and dispatch emergency Gmail to on-call engineer.',
  ];

  const handleGenerate = async (targetPrompt = null) => {
    const activePrompt = targetPrompt || prompt;
    if (!activePrompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await api.post('/workflows/generate', { prompt: activePrompt });
      if (res.data?.data) {
        const wf = res.data.data;
        setGeneratedWorkflow(wf);
        setEngineUsed(wf.generator);
        setWorkflow(wf);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToStudio = async () => {
    if (!generatedWorkflow) return;
    setIsSaving(true);
    try {
      const res = await api.post('/workflows', {
        name: generatedWorkflow.name,
        description: generatedWorkflow.description,
        nodes: generatedWorkflow.nodes,
        edges: generatedWorkflow.edges,
        triggerConfig: generatedWorkflow.triggerConfig,
        tags: generatedWorkflow.tags,
      });

      if (res.data?.data?._id) {
        router.push(`/workflows/${res.data.data._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunImmediately = async () => {
    if (!generatedWorkflow) return;
    setIsSaving(true);
    try {
      // First persist workflow
      const saveRes = await api.post('/workflows', {
        name: generatedWorkflow.name,
        description: generatedWorkflow.description,
        nodes: generatedWorkflow.nodes,
        edges: generatedWorkflow.edges,
        triggerConfig: generatedWorkflow.triggerConfig,
        tags: generatedWorkflow.tags,
      });

      const newId = saveRes.data?.data?._id;
      if (newId) {
        // Execute workflow
        const execRes = await api.post(`/workflows/${newId}/execute`, {});
        if (execRes.data?.data?.executionId) {
          router.push(`/executions/${execRes.data.data.executionId}`);
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Execution failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="AI Prompt-to-Workflow Builder">
        <div className="flex flex-col h-full bg-[#060a14] overflow-hidden">
          {/* Top Prompt Input Bar */}
          <div className="p-4 bg-[#0a0f1d] border-b border-slate-800 z-10 shadow-lg">
            <div className="max-w-7xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Natural Language Automation Engine
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Multi-agent pipeline materializes nodes, actions, and connections from plain English
                    </p>
                  </div>
                </div>

                {engineUsed && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <Cpu className="w-3 h-3" />
                    Engine: {engineUsed}
                  </span>
                )}
              </div>

              {/* Text Input & Generate Action */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Sparkles className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder="Describe your automation (e.g., 'When invoice email arrives, append to Google Sheets and notify Slack')..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                  />
                </div>

                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Synthesizing...' : 'Generate Graph'}</span>
                </button>
              </div>

              {/* Starter Suggestions */}
              {!generatedWorkflow && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 mr-1">
                    Try:
                  </span>
                  {promptSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPrompt(sug);
                        handleGenerate(sug);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors truncate max-w-xs"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Canvas Area or Placeholder */}
          <div className="flex-1 relative overflow-hidden">
            {generatedWorkflow ? (
              <>
                <WorkflowCanvas readOnly={false} />

                {/* Floating Bottom Action Bar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#0a0f1d]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700 shadow-2xl">
                  <div className="flex items-center gap-2 pr-3 border-r border-slate-800 text-xs">
                    <span className="font-semibold text-white truncate max-w-[200px]">
                      {generatedWorkflow.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {generatedWorkflow.nodes?.length || 0} nodes
                    </span>
                  </div>

                  <button
                    onClick={handleSaveToStudio}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Open in Canvas Studio</span>
                  </button>

                  <button
                    onClick={handleRunImmediately}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Save & Run Now</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">Prompt-to-Graph Generation Canvas</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                  Enter an operational instruction above or pick one of the starter templates. The autonomous agent orchestrator will construct topological nodes, configure actions, and render the graph here.
                </p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
