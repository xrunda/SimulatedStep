import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useStepSimulation } from '../hooks/useStepSimulation';
import { StepCounter } from './StepCounter';
import { ControlPanel } from './ControlPanel';
import { ActivityChart } from './ActivityChart';
import { ApiView } from './ApiView';

export const Dashboard: React.FC = () => {
  const { 
    steps, 
    addSteps, 
    isSimulating, 
    setIsSimulating, 
    activityStatus,
    history 
  } = useStepSimulation();

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
          <LayoutDashboard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">运动步数管理后台</h1>
          <p className="text-slate-400 text-sm">实时模拟器与集成中心</p>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Controls */}
        <div className="space-y-6 lg:col-span-1">
          <StepCounter steps={steps} status={activityStatus} />
          <ControlPanel 
            onAdd={addSteps} 
            isSimulating={isSimulating}
            onToggleSimulation={setIsSimulating}
          />
        </div>

        {/* Right Column: Charts & API */}
        <div className="space-y-6 lg:col-span-2">
          <ActivityChart data={history} />
          <ApiView currentSteps={steps} />
        </div>

      </div>
    </div>
  );
};