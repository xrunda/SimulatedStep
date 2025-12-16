import React, { useState } from 'react';
import { Copy, Check, Terminal, Globe, FileJson, Code2 } from 'lucide-react';

interface ApiViewProps {
  currentSteps: number;
}

type TabType = 'json' | 'curl' | 'js';

export const ApiView: React.FC<ApiViewProps> = ({ currentSteps }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('json');

  const apiResponse = {
    status: "success",
    data: {
      user_id: "usr_sim_8829",
      timestamp: new Date().toISOString(),
      step_count: currentSteps,
      reset_at: "00:00:00 local",
      device_source: "StepMaster_Sim_v1"
    }
  };

  const getSnippet = () => {
    switch (activeTab) {
      case 'json':
        return JSON.stringify(apiResponse, null, 2);
      case 'curl':
        return `curl -X GET https://api.stepmaster.sim/v1/steps \\
  -H "Accept: application/json"`;
      case 'js':
        return `// JavaScript Fetch Example
const response = await fetch('https://api.stepmaster.sim/v1/steps');
const result = await response.json();

console.log(\`当前步数: \${result.data.step_count}\`);`;
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />
          <h2 className="text-white font-semibold">外部 API 接口</h2>
        </div>
        <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono">PUBLIC ACCESS</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('json')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'json' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
              : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          <FileJson className="w-3 h-3" />
          <span>JSON 响应</span>
        </button>
        <button
          onClick={() => setActiveTab('curl')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'curl' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
              : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3 h-3" />
          <span>cURL 示例</span>
        </button>
        <button
          onClick={() => setActiveTab('js')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'js' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
              : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3 h-3" />
          <span>JS 示例</span>
        </button>
      </div>

      <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm border border-slate-800 relative group min-h-[160px] flex flex-col">
        <button 
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100 z-10"
          title="复制内容"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
        
        <pre className="text-indigo-300 overflow-x-auto whitespace-pre-wrap break-all flex-1">
          <code>
            {getSnippet()}
          </code>
        </pre>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        <p>集成说明：此接口为公开接口，无需 API Key 验证即可直接调用。数据实时更新。</p>
      </div>
    </div>
  );
};