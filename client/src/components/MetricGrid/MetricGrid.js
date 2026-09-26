import React from 'react';
import { GitBranch, Activity, CheckCircle2, Zap, Clock } from 'lucide-react';

export default function MetricGrid({ metrics = {} }) {
  const cards = [
    {
      label: 'Total Workflows',
      value: metrics.totalWorkflows ?? 0,
      subtext: `${metrics.activeWorkflows ?? 0} active in production`,
      icon: GitBranch,
      color: 'text-indigo-400',
      bgGlow: 'from-indigo-600/10 to-indigo-500/5',
      borderColor: 'border-indigo-500/20',
    },
    {
      label: 'Total Executions',
      value: metrics.totalExecutions ?? 0,
      subtext: `${metrics.runningExecutions ?? 0} runs currently active`,
      icon: Activity,
      color: 'text-blue-400',
      bgGlow: 'from-blue-600/10 to-blue-500/5',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Success Rate',
      value: `${metrics.successRate ?? 100}%`,
      subtext: `${metrics.completedExecutions ?? 0} succeeded, ${metrics.failedExecutions ?? 0} failed`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-600/10 to-emerald-500/5',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Agent Engine Health',
      value: '100%',
      subtext: '5 of 5 agents online & ready',
      icon: Zap,
      color: 'text-cyan-400',
      bgGlow: 'from-cyan-600/10 to-cyan-500/5',
      borderColor: 'border-cyan-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`relative p-5 rounded-xl bg-gradient-to-br ${card.bgGlow} bg-[#0c1222] border ${card.borderColor} shadow-lg backdrop-blur-sm transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-2xl font-bold text-white tracking-tight font-mono">{card.value}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
