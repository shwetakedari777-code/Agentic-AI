import React, { useState } from 'react';
import {
  Zap,
  Clock,
  Webhook,
  Sparkles,
  Mail,
  MessageSquare,
  Radio,
  Table,
  Plus,
  Search,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function NodePalette() {
  const [search, setSearch] = useState('');
  const addNodeFromPalette = useWorkflowStore((state) => state.addNodeFromPalette);

  const paletteGroups = [
    {
      category: 'Triggers',
      items: [
        {
          label: 'Webhook Trigger',
          type: 'triggerNode',
          provider: 'trigger',
          action: 'event_trigger',
          icon: Webhook,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          config: { triggerOn: 'instant', source: 'incoming_webhook' },
        },
        {
          label: 'Schedule Trigger',
          type: 'triggerNode',
          provider: 'trigger',
          action: 'schedule_trigger',
          icon: Clock,
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          config: { cron: '0 9 * * 1-5', timezone: 'UTC' },
        },
      ],
    },
    {
      category: 'AI Agents',
      items: [
        {
          label: 'AI Reasoning Task',
          type: 'actionNode',
          provider: 'ai',
          action: 'ai_prompt',
          icon: Sparkles,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          config: { task: 'reasoning', promptTemplate: 'Analyze and extract parameters' },
        },
        {
          label: 'Sentiment Classifier',
          type: 'actionNode',
          provider: 'ai',
          action: 'ai_prompt',
          icon: Sparkles,
          color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
          config: { task: 'sentiment_analysis' },
        },
      ],
    },
    {
      category: 'Integrations',
      items: [
        {
          label: 'Gmail Send Email',
          type: 'actionNode',
          provider: 'gmail',
          action: 'send_email',
          icon: Mail,
          color: 'text-red-400 bg-red-500/10 border-red-500/20',
          config: { to: 'operator@agentflow.ai', subject: 'Workflow Notification' },
        },
        {
          label: 'Slack Post Message',
          type: 'actionNode',
          provider: 'slack',
          action: 'post_message',
          icon: MessageSquare,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          config: { channel: '#ops-alerts', message: 'Automated alert from Agentflow' },
        },
        {
          label: 'Discord Broadcast',
          type: 'actionNode',
          provider: 'discord',
          action: 'post_message',
          icon: Radio,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          config: { channelId: 'ops-feed', message: 'Discord event stream update' },
        },
        {
          label: 'Google Sheets Append',
          type: 'actionNode',
          provider: 'google-sheets',
          action: 'append_row',
          icon: Table,
          color: 'text-green-400 bg-green-500/10 border-green-500/20',
          config: { spreadsheetId: 'Operational_Records_2026', range: 'Sheet1!A:Z' },
        },
      ],
    },
  ];

  const onDragStart = (event, item) => {
    event.dataTransfer.setData('application/reactflow-node', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col h-full select-none">
      {/* Header & Search */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Node Palette
        </h3>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search blocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Palette Node Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {paletteGroups.map((group) => {
          const filteredItems = group.items.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase())
          );
          if (filteredItems.length === 0) return null;

          return (
            <div key={group.category} className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                {group.category}
              </span>
              <div className="space-y-1">
                {filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => onDragStart(e, item)}
                      onClick={() => addNodeFromPalette(item)}
                      className="group flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-md border ${item.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">
                          {item.label}
                        </span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
