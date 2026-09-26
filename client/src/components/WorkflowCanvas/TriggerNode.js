import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Clock, Webhook } from 'lucide-react';

export default function TriggerNode({ data, selected }) {
  const isWebhook = data.action === 'event_trigger' || data.config?.source === 'incoming_webhook';
  const isSchedule = data.config?.type === 'schedule';

  return (
    <div
      className={`px-4 py-3 rounded-xl bg-[#0f172a] border transition-all min-w-[200px] shadow-xl ${
        selected
          ? 'border-indigo-500 shadow-indigo-500/25 ring-2 ring-indigo-500/30'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
          {isWebhook ? <Webhook className="w-4 h-4" /> : isSchedule ? <Clock className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
        </div>
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">
            TRIGGER
          </span>
          <h4 className="text-xs font-semibold text-slate-100 truncate max-w-[140px]">
            {data.label || 'Event Trigger'}
          </h4>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Type:</span>
        <span className="font-mono text-slate-300">{data.config?.triggerOn || 'Manual / Instant'}</span>
      </div>

      {/* Target/Source Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-indigo-500 border-2 border-[#0f172a] rounded-full"
      />
    </div>
  );
}
