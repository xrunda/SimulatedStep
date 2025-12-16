import React, { useState } from 'react';
import { Plus, Settings2, Play, Pause } from 'lucide-react';

interface ControlPanelProps {
  onAdd: (amount: number) => void;
  isSimulating: boolean;
  onToggleSimulation: (val: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onAdd, isSimulating, onToggleSimulation }) => {
  const [customAmount, setCustomAmount] = useState<string>('');

  const handleCustomAdd = () => {
    const val = parseInt(customAmount, 10);
    if (!isNaN(val) && val !== 0) {
      onAdd(val);
      setCustomAmount('');
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-white font-semibold">管理控制台</h2>
        </div>
        <button
          onClick={() => onToggleSimulation(!isSimulating)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            isSimulating 
              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
              : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
          }`}
        >
          {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {isSimulating ? '模拟进行中' : '已暂停'}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 mb-2 block">快速增加</label>
          <div className="grid grid-cols-3 gap-3">
            {[500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                onClick={() => onAdd(amt)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-700 hover:bg-indigo-600 transition-all active:scale-95 group"
              >
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-white mb-1" />
                <span className="text-sm font-medium text-white">+{amt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <label className="text-xs text-slate-400 mb-2 block">自定义调整</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="输入步数..."
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
            <button
              onClick={handleCustomAdd}
              disabled={!customAmount}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              更新
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            * 输入负数可减少步数。
          </p>
        </div>
      </div>
    </div>
  );
};