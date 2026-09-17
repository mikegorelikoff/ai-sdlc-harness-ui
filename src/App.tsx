import { useState, useEffect } from 'react';
import { 
  Folder, Play, Search, Activity, Archive, LayoutTemplate, Settings, CheckCircle2, 
  Clock, AlertCircle, FileCode2, Terminal, ShieldCheck,
  ChevronRight, ArrowRight, Cpu, GitBranch, ShieldAlert, FileDiff, Zap
} from 'lucide-react';

type Profile = 'loop' | 'backbone';
type Status = 'empty' | 'loading' | 'running' | 'awaiting_approval' | 'blocked' | 'failed' | 'interrupted' | 'completed' | 'disconnected' | 'stale';

const LOOP_STAGES = [
  'Specify', 'Implementation approval', 'Implement', 
  'Engineering Quality Gate', 'Verify', 'Commit approval', 'Commit'
];

export default function App() {

  const [profile, setProfile] = useState<Profile>('loop');
  const [status, setStatus] = useState<Status>('empty');
  const [stageIndex, setStageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('Session');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [projectName, setProjectName] = useState('loading...');

  // Production-ready data fetching adapter
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/session');
        const data = await res.json();
        setProfile(data.profile);
        setStatus(data.status);
        setStageIndex(data.stageIndex);
        setIsConnected(data.connected);
        setProjectName(data.projectName);
      } catch (err) {
        setIsConnected(false);
      }
    };
    fetchState();
    const interval = setInterval(fetchState, 1000); // Polling for state updates
    return () => clearInterval(interval);
  }, []);

  const stages = profile === 'loop' ? LOOP_STAGES : ['Request', 'Explore', 'Specify', 'Plan', 'Implement', 'Verify', 'Handoff'];

  const handleApprove = async () => {
    setStatus('running'); // Optimistic
    await fetch('/api/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' })
    });
  };

  const handleSimulateDrift = async () => {
    await fetch('/api/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'drift' })
    });
  };

  return (
    <div className="flex h-screen bg-[#0e0e11] text-[#ededef] font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* LEFT SIDEBAR */}
      <div className="w-[260px] flex-shrink-0 bg-[#141417] border-r border-[#27272a] flex flex-col">
        {/* Workspace Selector */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#27272a] hover:bg-[#1f1f22] cursor-pointer transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-900/20">
              <Folder className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold text-sm truncate text-[#ededef]">{projectName}</span>
              <span className="text-[10px] font-mono text-[#a1a1aa]">mikegorelikoff</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#71717a]" />
        </div>
        
        {/* New Action */}
        <div className="p-4">
          <button className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm shadow-blue-900/20 py-2 px-3 rounded-md text-sm font-medium transition-all active:scale-[0.98]">
            <Play className="w-4 h-4 fill-current" />
            New Session
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="relative mb-6">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#71717a]" />
            <input 
              type="text" 
              placeholder="Search sessions..." 
              className="w-full bg-[#0e0e11] border border-[#27272a] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#ededef] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#71717a]"
            />
          </div>
          
          <div className="text-[11px] font-semibold text-[#71717a] mb-2 uppercase tracking-wider px-1">Active Sessions</div>
          <div className="space-y-0.5 mb-6">
            <div className="flex items-start gap-2.5 p-2 rounded-md bg-[#27272a]/50 border border-[#3f3f46]/50 cursor-pointer">
              <div className="mt-0.5 relative flex items-center justify-center">
                <Activity className="w-4 h-4 text-amber-500" />
                <span className="absolute w-2 h-2 rounded-full bg-amber-500 animate-ping opacity-20"></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-amber-50">Webhook idempotency</div>
                <div className="text-[11px] text-[#a1a1aa] mt-0.5 flex items-center gap-1.5">
                  <span className="bg-[#1f1f22] border border-[#3f3f46] px-1 rounded text-[10px] uppercase font-semibold">Loop</span>
                  <span>Awaiting</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-[#71717a] mb-2 uppercase tracking-wider px-1">Recent</div>
          <div className="space-y-0.5">
            <div className="flex items-start gap-2.5 p-2 rounded-md hover:bg-[#1f1f22] cursor-pointer transition-colors group">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate text-[#d4d4d8] group-hover:text-white transition-colors">Update README</div>
                <div className="text-[11px] text-[#71717a] mt-0.5">Backbone • 2h ago</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2 rounded-md hover:bg-[#1f1f22] cursor-pointer transition-colors group">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate text-[#d4d4d8] group-hover:text-white transition-colors">Fix validation bug</div>
                <div className="text-[11px] text-[#71717a] mt-0.5">Loop • Yesterday</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-3 border-t border-[#27272a] text-sm space-y-0.5">
          <div className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-[#1f1f22] rounded-md cursor-pointer text-[#a1a1aa] hover:text-[#ededef] transition-colors"><Archive className="w-4 h-4"/> Artifacts</div>
          <div className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-[#1f1f22] rounded-md cursor-pointer text-[#a1a1aa] hover:text-[#ededef] transition-colors"><LayoutTemplate className="w-4 h-4"/> Skills</div>
          <div className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-[#1f1f22] rounded-md cursor-pointer text-[#a1a1aa] hover:text-[#ededef] transition-colors"><Activity className="w-4 h-4"/> Diagnostics</div>
          <div className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-[#1f1f22] rounded-md cursor-pointer text-[#a1a1aa] hover:text-[#ededef] transition-colors"><Settings className="w-4 h-4"/> Settings</div>
        </div>
      </div>

      {/* CENTER CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="h-14 border-b border-[#27272a] flex items-center px-6 justify-between bg-[#0e0e11]/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-[15px] font-semibold text-white tracking-tight">Webhook idempotency</h1>
            <div className="h-4 w-px bg-[#3f3f46]"></div>
            <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
              <span className="flex items-center gap-1.5 bg-[#1f1f22] border border-[#27272a] px-2 py-0.5 rounded-full text-[#d4d4d8]">
                <GitBranch className="w-3 h-3" />
                <span className="font-mono mt-px">feature/webhook</span>
              </span>
              <span className="flex items-center gap-1.5">
                {status === 'awaiting_approval' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                {status === 'running' && <Activity className="w-3.5 h-3.5 text-blue-500" />}
                {status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />}
                {status === 'stale' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                <span className={`capitalize font-medium ${status === 'stale' ? 'text-red-400' : status === 'awaiting_approval' ? 'text-amber-400' : 'text-[#d4d4d8]'}`}>
                  {status.replace('_', ' ')}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className={`px-2.5 py-1 ${isConnected ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#1f1f22] text-[#a1a1aa]'} border border-[#27272a] rounded-md text-[11px] font-mono flex items-center gap-1.5`}>
               <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#22c55e]' : 'bg-red-500'}`}></span>
               {isConnected ? 'Connected' : 'Disconnected'}
             </div>
             <button onClick={() => setIsInspectorOpen(!isInspectorOpen)} className={`p-1.5 rounded-md transition-colors ${isInspectorOpen ? 'bg-[#27272a] text-white' : 'hover:bg-[#1f1f22] text-[#a1a1aa]'}`}>
               <LayoutTemplate className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Progress Pipeline */}
        <div className="px-6 py-4 border-b border-[#27272a] bg-[#141417]">
          <div className="flex items-center justify-between text-xs relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#27272a] rounded-full z-0"></div>
            {stages.map((stage, idx) => {
              const isPast = idx < stageIndex;
              const isCurrent = idx === stageIndex;
              const isFuture = idx > stageIndex;
              
              return (
                <div key={stage} className="flex flex-col items-center relative z-10 group">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-[2.5px] transition-all bg-[#141417]
                    ${isPast ? 'border-[#22c55e] bg-[#22c55e]/10' : ''}
                    ${isCurrent ? 'border-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.4)]' : ''}
                    ${isFuture ? 'border-[#3f3f46]' : ''}
                  `}>
                    {isPast && <CheckCircle2 className="w-3 h-3 text-[#22c55e]" />}
                    {isCurrent && <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>}
                  </div>
                  <span className={`absolute top-8 whitespace-nowrap text-[11px] font-medium transition-colors
                    ${isCurrent ? 'text-[#ededef]' : isPast ? 'text-[#a1a1aa]' : 'text-[#71717a]'}
                  `}>{stage}</span>
                </div>
              );
            })}
          </div>
          <div className="h-6"></div> {/* Spacer for absolute text */}
        </div>

        {/* Call to action bar */}
        {(status === 'awaiting_approval' || status === 'stale') && (
          <div className={`px-6 py-3 border-b border-[#27272a] flex items-center justify-between
            ${status === 'stale' ? 'bg-red-500/5' : 'bg-amber-500/5'}
          `}>
            <div className="flex items-center gap-3">
              {status === 'stale' ? 
                <ShieldAlert className="text-red-500 w-5 h-5 flex-shrink-0"/> : 
                <ShieldAlert className="text-amber-500 w-5 h-5 flex-shrink-0"/>
              }
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${status === 'stale' ? 'text-red-400' : 'text-amber-400'}`}>
                  {status === 'stale' ? "Approval stale due to scope drift." : 
                    (stageIndex === 1 ? "Explicit implementation approval required." : "Explicit commit approval required.")}
                </span>
                <span className="text-[11px] text-[#a1a1aa] mt-0.5">
                  {status === 'stale' ? "The context has changed since the last review. Please re-review the scope." : 
                    "Review the bounded paths and specification in the Inspector before proceeding."}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSimulateDrift} className="px-3.5 py-2 text-sm font-medium text-[#ededef] hover:bg-[#27272a] border border-[#3f3f46] rounded-md transition-colors shadow-sm">
                Request changes
              </button>
              <button 
                onClick={handleApprove}
                className="px-3.5 py-2 text-sm font-medium bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md transition-all shadow-sm shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2"
              >
                {status === 'stale' ? 'Re-approve' : (stageIndex === 1 ? 'Approve implementation' : 'Approve commit')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex px-6 border-b border-[#27272a] bg-[#0e0e11]">
          {['Session', 'Trajectory', 'Changes', 'Artifacts'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-[2.5px] transition-all
                ${activeTab === tab ? 'border-[#3b82f6] text-white' : 'border-transparent text-[#71717a] hover:text-[#a1a1aa] hover:border-[#3f3f46]'}
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-[#0e0e11] p-6">
          {activeTab === 'Session' && (
            <div className="max-w-3xl space-y-8 mx-auto">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-md bg-[#27272a] border border-[#3f3f46] flex items-center justify-center flex-shrink-0 text-[#ededef] font-medium text-sm shadow-sm">U</div>
                <div className="pt-1.5 text-sm text-[#d4d4d8] leading-relaxed">
                  <p>Add idempotent webhook processing without changing the public API.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-900/20">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
                <div className="pt-1 w-full">
                  <div className="text-sm text-[#d4d4d8] leading-relaxed mb-4">
                    I've examined the <code className="bg-[#1f1f22] border border-[#27272a] px-1.5 py-0.5 rounded text-[13px] font-mono text-[#3b82f6]">src/webhook.js</code> file. I plan to use the <code>x-event-id</code> header to check a local store before processing.
                  </div>
                  
                  <div className="bg-[#141417] border border-[#27272a] rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-[#ededef] font-medium text-sm">
                        <FileCode2 className="w-4 h-4 text-[#3b82f6]" />
                        <span>Specification generated</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#71717a] bg-[#1f1f22] px-1.5 py-0.5 rounded border border-[#27272a]">f9a3b2c1</span>
                    </div>
                    <div className="text-xs text-[#a1a1aa] mb-3">
                      The TOON specification outlines the exact changes required. Implementation awaits explicit approval.
                    </div>
                    <button className="text-[13px] font-medium text-[#3b82f6] hover:text-[#60a5fa] transition-colors flex items-center gap-1">
                      View TOON spec <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Changes' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border border-[#27272a] rounded-lg overflow-hidden shadow-sm bg-[#141417]">
                <div className="bg-[#1f1f22] px-4 py-2.5 border-b border-[#27272a] flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileDiff className="w-4 h-4 text-[#a1a1aa]" />
                    <span className="font-mono text-[13px] text-[#ededef]">src/webhook.js</span>
                  </div>
                  <span className="text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded text-[11px] font-medium border border-[#22c55e]/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Allowed path
                  </span>
                </div>
                <div className="bg-[#0e0e11] font-mono text-[13px] overflow-x-auto">
                  {stageIndex >= 3 ? (
                    <table className="w-full border-collapse text-left whitespace-pre">
                      <tbody>
                        <tr className="bg-red-500/10 text-red-400">
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">12</td>
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">-</td>
                          <td className="px-4 py-0.5">- app.post('/webhook', (req, res) =&gt; {'{'}</td>
                        </tr>
                        <tr className="bg-red-500/10 text-red-400">
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">13</td>
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">-</td>
                          <td className="px-4 py-0.5">-   processEvent(req.body);</td>
                        </tr>
                        <tr className="bg-green-500/10 text-green-400">
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">+</td>
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">12</td>
                          <td className="px-4 py-0.5">+ app.post('/webhook', <span className="text-[#c084fc]">async</span> (req, res) =&gt; {'{'}</td>
                        </tr>
                        <tr className="bg-green-500/10 text-green-400">
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">+</td>
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">13</td>
                          <td className="px-4 py-0.5">+   <span className="text-[#c084fc]">const</span> eventId = req.headers[<span className="text-[#a3e635]">'x-event-id'</span>];</td>
                        </tr>
                        <tr className="bg-green-500/10 text-green-400">
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">+</td>
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">14</td>
                          <td className="px-4 py-0.5">+   <span className="text-[#c084fc]">if</span> (<span className="text-[#c084fc]">await</span> isProcessed(eventId)) <span className="text-[#c084fc]">return</span> res.status(200).send(<span className="text-[#a3e635]">'OK'</span>);</td>
                        </tr>
                        <tr className="bg-green-500/10 text-green-400">
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">+</td>
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">15</td>
                          <td className="px-4 py-0.5">+   <span className="text-[#c084fc]">await</span> processEvent(req.body);</td>
                        </tr>
                        <tr className="bg-green-500/10 text-green-400">
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">+</td>
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">16</td>
                          <td className="px-4 py-0.5">+   <span className="text-[#c084fc]">await</span> markProcessed(eventId);</td>
                        </tr>
                        <tr className="text-[#a1a1aa] hover:bg-[#1f1f22]">
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">14</td>
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">17</td>
                          <td className="px-4 py-0.5">    res.status(200).send(<span className="text-[#a3e635]">'OK'</span>);</td>
                        </tr>
                        <tr className="text-[#a1a1aa] hover:bg-[#1f1f22]">
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">15</td>
                          <td className="w-8 text-center text-[#71717a] select-none border-r border-[#27272a] py-0.5">18</td>
                          <td className="px-4 py-0.5">  {'}'});</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                      <FileDiff className="w-8 h-8 text-[#3f3f46] mb-3" />
                      <span className="text-[#a1a1aa] text-sm">No diff available yet. Awaiting implementation approval.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Trajectory' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="relative border-l-2 border-[#27272a] ml-4 pl-8 py-2">
                
                <div className="relative mb-10">
                  <div className="absolute -left-[43px] top-1 w-8 h-8 rounded-full bg-[#141417] border-2 border-[#27272a] flex items-center justify-center shadow-sm">
                    <Terminal className="w-3.5 h-3.5 text-[#a1a1aa]"/>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-[#ededef]">grep_search</span>
                      <span className="text-[11px] font-mono text-[#71717a] bg-[#1f1f22] px-1.5 py-0.5 rounded border border-[#27272a]">Exit 0</span>
                      <span className="text-[11px] text-[#71717a]">2.4s</span>
                    </div>
                    <div className="bg-[#141417] p-3 rounded-lg border border-[#27272a] font-mono text-[12px] text-[#a1a1aa] shadow-sm">
                      <span className="text-[#60a5fa]">Query:</span> app.post('/webhook'<br/>
                      <span className="text-[#60a5fa]">Path:</span> src/
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[43px] top-1 w-8 h-8 rounded-full bg-[#22c55e]/10 border-2 border-[#22c55e]/20 flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#22c55e]"/>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-[#ededef]">Scope enforcement</span>
                      <span className="text-[11px] font-mono text-[#22c55e] bg-[#22c55e]/10 px-1.5 py-0.5 rounded border border-[#22c55e]/20">Pass</span>
                    </div>
                    <p className="text-[#a1a1aa] bg-[#141417] p-3 rounded-lg border border-[#27272a] text-[13px] shadow-sm">
                      Paths bounded strictly to <code className="text-[#3b82f6] bg-[#1f1f22] px-1 py-0.5 rounded border border-[#27272a] font-mono text-[11px]">src/webhook.js</code>
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'Artifacts' && (
            <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
              <div className="border border-[#27272a] rounded-lg p-4 bg-[#141417] hover:border-[#3f3f46] hover:bg-[#1f1f22] transition-all cursor-pointer group shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-[#3b82f6]/10 text-[#3b82f6]">
                      <FileCode2 className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-[14px] text-[#ededef] group-hover:text-white transition-colors">spec.toon</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#71717a] bg-[#0e0e11] px-1.5 py-0.5 rounded border border-[#27272a]">f9a3b2c1</span>
                </div>
                <p className="text-[13px] text-[#a1a1aa] mb-4 line-clamp-2">Implementation specification for webhook idempotency containing exact abstract syntax diffs.</p>
                <div className="flex justify-between items-center text-[11px] text-[#71717a] border-t border-[#27272a] pt-3 mt-auto">
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3"/> Just now</span>
                  <span className="text-[#3b82f6] font-medium opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT INSPECTOR */}
      {isInspectorOpen && (
        <div className="w-[340px] flex-shrink-0 bg-[#141417] border-l border-[#27272a] flex flex-col shadow-xl z-20">
          <div className="h-14 border-b border-[#27272a] flex items-center px-5 justify-between">
            <span className="font-semibold text-[14px] text-[#ededef]">Run Inspector</span>
            <button onClick={() => setIsInspectorOpen(false)} className="text-[#71717a] hover:text-[#ededef] p-1 rounded-md hover:bg-[#27272a] transition-colors md:hidden">
               <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-8">
            
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-[#71717a]"/>
                <h3 className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider">Scope Definition</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-[#a1a1aa] text-[12px] mb-1.5 font-medium">Action type</div>
                  <div className="bg-[#1f1f22] border border-[#27272a] rounded-md px-3 py-2 text-[#ededef] text-[13px] shadow-sm">Implement & Verify</div>
                </div>
                <div>
                  <div className="text-[#a1a1aa] text-[12px] mb-1.5 font-medium">Allowed Paths</div>
                  <div className="bg-[#1f1f22] border border-[#27272a] rounded-md px-3 py-2 text-[#d4d4d8] font-mono text-[12px] shadow-sm">
                    src/webhook.js<br/>
                    <span className="text-[#71717a]">tests/webhook.test.js</span>
                  </div>
                </div>
                <div>
                  <div className="text-[#a1a1aa] text-[12px] mb-1.5 font-medium">Acceptance Criteria</div>
                  <ul className="bg-[#1f1f22] border border-[#27272a] rounded-md px-4 py-3 text-[#d4d4d8] text-[13px] shadow-sm space-y-2 list-disc list-inside">
                    <li className="leading-snug">Duplicate webhook IDs return 200 OK without processing</li>
                    <li className="leading-snug">Public API contract unchanged</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="h-px bg-[#27272a] w-full"></div>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Archive className="w-4 h-4 text-[#71717a]"/>
                <h3 className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider">Context Sources</h3>
              </div>
              <div className="space-y-2">
                <div className="bg-[#1f1f22] border border-[#27272a] rounded-md p-3 shadow-sm hover:border-[#3f3f46] transition-colors cursor-default">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-[12px] text-[#ededef] truncate">src/webhook.js</span>
                    <span className="text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide">Fresh</span>
                  </div>
                  <div className="text-[11px] text-[#71717a]">Loaded via Explore stage based on search heuristic</div>
                </div>
              </div>
            </section>

            <div className="h-px bg-[#27272a] w-full"></div>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#71717a]"/>
                <h3 className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider">Evidence</h3>
              </div>
              
              {stageIndex >= 4 ? (
                <div className="space-y-3">
                  <div className="bg-[#1f1f22] border border-[#27272a] rounded-md p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
                      <span className="font-semibold text-[13px] text-[#ededef]">Engineering Quality Gate</span>
                    </div>
                    <div className="text-[#a1a1aa] font-mono text-[12px] bg-[#0e0e11] p-2 rounded border border-[#27272a]">0 High, 0 Medium findings</div>
                  </div>
                  <div className="bg-[#1f1f22] border border-[#27272a] rounded-md p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                      <span className="font-semibold text-[13px] text-[#ededef] truncate">npm test webhook.test.js</span>
                    </div>
                    <div className="text-[#a1a1aa] font-mono text-[11px] bg-[#0e0e11] p-2 rounded border border-[#27272a] leading-relaxed">
                      <span className="text-[#22c55e]">PASS</span> tests/webhook.test.js<br/>
                      <span className="text-[#22c55e]">✓</span> process event <span className="text-[#71717a]">(12ms)</span><br/>
                      <span className="text-[#22c55e]">✓</span> ignore duplicate <span className="text-[#71717a]">(8ms)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1f1f22] border border-[#27272a] border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="w-6 h-6 text-[#3f3f46] mb-2" />
                  <span className="text-[13px] text-[#a1a1aa]">No evidence generated yet.</span>
                  <span className="text-[11px] text-[#71717a] mt-1">Tests and quality gates will run after implementation.</span>
                </div>
              )}
            </section>

          </div>
        </div>
      )}
    </div>
  );
}
