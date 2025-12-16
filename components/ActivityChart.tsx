import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StepHistoryPoint } from '../types';

interface ActivityChartProps {
  data: StepHistoryPoint[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  if (data.length < 2) {
    return (
      <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 flex flex-col items-center justify-center h-[300px] text-slate-500">
        <p>等待模拟数据...</p>
        <p className="text-xs mt-2">每 5 分钟生成一个历史记录点</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
      <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-6">活动趋势 (今日)</h2>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              tick={{fontSize: 12}} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{fontSize: 12}} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#818cf8' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area 
              name="步数"
              type="monotone" 
              dataKey="steps" 
              stroke="#818cf8" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSteps)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};