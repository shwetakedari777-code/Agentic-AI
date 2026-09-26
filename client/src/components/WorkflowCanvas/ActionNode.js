import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Mail,
  MessageSquare,
  Radio,
  Table,
  Sparkles,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function ActionNode({ data, selected }) {
  const provider = data.provider || 'system';

  const getProviderIcon = () => {
    switch (provider) {
      case 'gmail':
        return <Mail className="w-4 h-4 text-red-400" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'discord':
        return <Radio className="w-4 h-4 text-indigo-400" />;
      case 'google-sheets':
        return <Table className="w-4 h-4 text-green-400" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getProviderBadge = () => {
    switch (provider) {
      case 'gmail':
        return 'bg-red-500/10 text-red-300 border-red-500/20';
      case 'slack':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'discord':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      case 'google-sheets':
        return 'bg-green-500/10 text-green-300 border-green-500/20';
      case 'ai':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      default:
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
    }
  };

  const executionStatus = data.executionStatus; // 'running' | 'success' | 'failed'

  return (
    <div
      className={`px-4 py-3 rounded-xl bg-[#0f172a] border transition-all min-w-[210px] shadow-xl relative ${
        selected
          ? 'border-indigo-500 shadow-indigo-500/25 ring-2 ring-indigo-500/30'
          : executionStatus === 'running'
          ? 'border-cyan-500 shadow-cyan-500/30 ring-2 ring-cyan-500/40 animate-pulse'
          : executionStatus === 'success'
          ? 'border-emerald-500/80 shadow-emerald-500/20'
          : executionStatus === 'failed'
          ? 'border-rose-500 shadow-rose-500/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-indigo-500 border-2 border-[#0f172a] rounded-full"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
            {getProviderIcon()}
          </div>
          <div>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getProviderBadge()}`}>
              {provider}
            </span>
            <h4 className="text-xs font-semibold text-slate-100 truncate max-w-[140px] mt-1">
              {data.label || 'Action Step'}
            </h4>
          </div>
        </div>

        {/* Status Pill */}
        {executionStatus === 'running' && (
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
        )}
        {executionStatus === 'success' && (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        {executionStatus === 'failed' && (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        )}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="truncate max-w-[90px]">action:</span>
        <span className="text-slate-300 truncate max-w-[110px]">{data.action || 'execute'}</span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-indigo-500 border-2 border-[#0f172a] rounded-full"
      />
    </div>
  );
}
