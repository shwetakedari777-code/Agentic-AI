import React, { useState, useEffect } from 'react';
import { X, Trash2, Sliders, Check } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function NodeConfigPanel() {
  const selectedNode = useWorkflowStore((state) => state.selectedNode);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);

  const [label, setLabel] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data?.label || '');
      setConfig(selectedNode.data?.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return null;
  }

  const provider = selectedNode.data?.provider || 'system';
  const action = selectedNode.data?.action || 'run';

  const handleConfigChange = (key, value) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    updateNodeConfig(selectedNode.id, { label, config: updated });
  };

  const handleLabelChange = (newLabel) => {
    setLabel(newLabel);
    updateNodeConfig(selectedNode.id, { label: newLabel, config });
  };

  return (
    <div className="w-80 bg-[#0a0f1d] border-l border-slate-800 flex flex-col h-full z-10 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
            Step Inspector
          </h3>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Configuration Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Step Name / Label */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Step Name</label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Node ID & Provider Badges */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block">Provider:</span>
            <span className="text-indigo-300 font-semibold">{provider}</span>
          </div>
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 block">Action:</span>
            <span className="text-indigo-300 font-semibold truncate block">{action}</span>
          </div>
        </div>

        {/* Dynamic Fields by Provider */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Parameters & Payload
          </span>

          {provider === 'gmail' && (
            <>
              <div>
                <label className="block text-slate-400 mb-1">Recipient (To:)</label>
                <input
                  type="email"
                  value={config.to || ''}
                  onChange={(e) => handleConfigChange('to', e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={config.subject || ''}
                  onChange={(e) => handleConfigChange('subject', e.target.value)}
                  placeholder="Alert Subject"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email Body</label>
                <textarea
                  rows={3}
                  value={config.body || ''}
                  onChange={(e) => handleConfigChange('body', e.target.value)}
                  placeholder="Message content..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>
            </>
          )}

          {provider === 'slack' && (
            <>
              <div>
                <label className="block text-slate-400 mb-1">Channel</label>
                <input
                  type="text"
                  value={config.channel || ''}
                  onChange={(e) => handleConfigChange('channel', e.target.value)}
                  placeholder="#ops-alerts"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Message Template</label>
                <textarea
                  rows={3}
                  value={config.message || ''}
                  onChange={(e) => handleConfigChange('message', e.target.value)}
                  placeholder="Enter message with {{trigger.payload}} syntax..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>
            </>
          )}

          {provider === 'discord' && (
            <>
              <div>
                <label className="block text-slate-400 mb-1">Webhook URL or Channel ID</label>
                <input
                  type="text"
                  value={config.webhookUrl || config.channelId || ''}
                  onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Alert Message</label>
                <textarea
                  rows={3}
                  value={config.message || ''}
                  onChange={(e) => handleConfigChange('message', e.target.value)}
                  placeholder="Discord alert text..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>
            </>
          )}

          {provider === 'google-sheets' && (
            <>
              <div>
                <label className="block text-slate-400 mb-1">Spreadsheet ID</label>
                <input
                  type="text"
                  value={config.spreadsheetId || ''}
                  onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                  placeholder="Spreadsheet name or ID"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Range</label>
                <input
                  type="text"
                  value={config.range || ''}
                  onChange={(e) => handleConfigChange('range', e.target.value)}
                  placeholder="Sheet1!A:Z"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>
            </>
          )}

          {provider === 'ai' && (
            <>
              <div>
                <label className="block text-slate-400 mb-1">Task Type</label>
                <select
                  value={config.task || 'reasoning'}
                  onChange={(e) => handleConfigChange('task', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="reasoning">Reasoning & Extraction</option>
                  <option value="summarization">Data Summarization</option>
                  <option value="sentiment_analysis">Sentiment Classification</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Prompt Instructions</label>
                <textarea
                  rows={3}
                  value={config.promptTemplate || ''}
                  onChange={(e) => handleConfigChange('promptTemplate', e.target.value)}
                  placeholder="Instruction prompt..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>
            </>
          )}

          {provider === 'trigger' && (
            <div>
              <label className="block text-slate-400 mb-1">Trigger Execution Mode</label>
              <select
                value={config.triggerOn || 'instant'}
                onChange={(e) => handleConfigChange('triggerOn', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="instant">Instant on incoming payload</option>
                <option value="batch">Batch / Scheduled window</option>
                <option value="manual">Manual operator trigger only</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors text-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node</span>
        </button>

        <button
          onClick={() => selectNode(null)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
}
