import React from 'react';
import { Footprints, Activity, Flame } from 'lucide-react';

interface StepCounterProps {
  steps: number;
  status: 'IDLE' | 'WALKING' | 'RUNNING';
}

export const StepCounter: React.FC<StepCounterProps> = ({ steps, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'RUNNING': return 'text-orange-500 animate-pulse';
      case 'WALKING': return 'text-emerald-500';
      default: return 'text-slate-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'RUNNING': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'WALKING': return <Activity className="w-5 h-5 text-emerald-500" />;
      default: return <Footprints className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'RUNNING': return '跑步中';
      case 'WALKING': return '行走中';
      default: return '静止';
    }
  };

  // Approximate calories (0.04 cal per step) and km (0.7m per step)
  const calories = Math.floor(steps * 0.04);
  const distance = (steps * 0.0007).toFixed(2);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Footprints className="w-32 h-32 text-white" />
      </div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider">实时步数</h2>
        <div className={`flex items-center gap-2 text-xs font-bold px-2 py-1 rounded-full bg-slate-900 border border-slate-700 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-6xl font-bold text-white tabular-nums tracking-tight">
          {steps.toLocaleString()}
        </div>
        <div className="text-slate-400 text-sm mt-1">今日总计</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
          <div className="text-slate-400 text-xs">距离</div>
          <div className="text-xl font-semibold text-blue-400">{distance} <span className="text-xs text-slate-500">公里</span></div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
          <div className="text-slate-400 text-xs">消耗</div>
          <div className="text-xl font-semibold text-orange-400">{calories} <span className="text-xs text-slate-500">千卡</span></div>
        </div>
      </div>
    </div>
  );
};