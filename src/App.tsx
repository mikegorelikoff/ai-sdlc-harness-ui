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
  const [requestText, setRequestText] = useState('Loading request...');
  const [diffText, setDiffText] = useState('');
  const [diffFiles, setDiffFiles] = useState<string[]>([]);
  const [sessions, setSessions] = useState<{branch: string, subject: string, active: boolean}[]>([]);
  const [trajectory, setTrajectory] = useState<{hash: string, message: string, time: string}[]>([]);
  const [artifacts, setArtifacts] = useState<{name: string, path: string, type: string}[]>([]);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
      setProfile(data.profile);
      setStatus(data.status);
      setStageIndex(data.stageIndex);
      setIsConnected(data.connected);
      setProjectName(data.projectName);
      setRequestText(data.requestText || 'No request description');
      setDiffText(data.diffText || '');
      setDiffFiles(data.files || []);
      setSessions(data.sessions || []);
      setTrajectory(data.trajectory || []);
      setArtifacts(data.artifacts || []);
    } catch (err) {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const switchBranch = async (branch: string) => {
    await fetch('/api/switch-branch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch })
    });
    await fetchState();
  };

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
            {sessions.length > 0 ? sessions.map((s, i) => (
              <div 
                key={i} 
                onClick={() => !s.active && switchBranch(s.branch)}
                className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${s.active ? 'bg-[#27272a]/50 border border-[#3f3f46]/50' : 'hover:bg-[#1f1f22]'}`}
              >
                {s.active ? (
                  <div className="mt-0.5 relative flex items-center justify-center">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span className="absolute w-2 h-2 rounded-full bg-amber-500 animate-ping opacity-20"></span>
                  </div>
                ) : (
                  <GitBranch className="w-4 h-4 text-[#71717a] mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${s.active ? 'text-amber-50' : 'text-[#d4d4d8]'}`}>{s.subject}</div>
                  <div className="text-[11px] text-[#a1a1aa] mt-0.5 flex items-center gap-1.5">
                    {s.active && <span className="bg-[#1f1f22] border border-[#3f3f46] px-1 rounded text-[10px] uppercase font-semibold">{profile}</span>}
                    <span className="truncate">{s.branch}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-xs text-[#71717a] px-2 italic">No branches found</div>
            )}
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
                  <p className="whitespace-pre-wrap">{requestText}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-900/20">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
                <div className="pt-1 w-full">
                  <div className="text-sm text-[#d4d4d8] leading-relaxed mb-4">
                    I've examined the repository and prepared the workspace.
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
                    <span className="font-mono text-[13px] text-[#ededef]">
                       {diffFiles.length > 0 ? diffFiles.join(', ') : 'No files changed yet'}
                    </span>
                  </div>
                  <span className="text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded text-[11px] font-medium border border-[#22c55e]/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Bounded
                  </span>
                </div>
                <div className="bg-[#0e0e11] font-mono text-[13px] overflow-x-auto p-4">
                  {diffText ? (
                    <pre className="text-[#a1a1aa] whitespace-pre-wrap">
                      {diffText.split('\n').map((line, i) => {
                        let color = 'text-[#a1a1aa]';
                        if (line.startsWith('+')) color = 'text-green-400';
                        if (line.startsWith('-')) color = 'text-red-400';
                        if (line.startsWith('@@')) color = 'text-blue-400';
                        return <div key={i} className={color}>{line}</div>;
                      })}
                    </pre>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                      <FileDiff className="w-8 h-8 text-[#3f3f46] mb-3" />
                      <span className="text-[#a1a1aa] text-sm">No diff available.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Trajectory' && (
            <div className="flex flex-col h-full bg-[#0e0e11] overflow-hidden">
              {/* Activity Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* User Request Bubble */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#1f1f22] border border-[#3f3f46] flex items-center justify-center flex-shrink-0 text-[#ededef] font-medium text-sm shadow-sm">U</div>
                  <div className="pt-1 w-full max-w-3xl">
                    <div className="font-semibold text-sm text-[#ededef] mb-1">User</div>
                    <div className="text-sm text-[#d4d4d8] leading-relaxed whitespace-pre-wrap">{requestText}</div>
                  </div>
                </div>

                {/* Agent Activity */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 shadow-sm relative">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    {stageIndex > 0 && stageIndex < 5 && (
                       <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping opacity-50"></span>
                    )}
                  </div>
                  <div className="pt-1 w-full max-w-3xl">
                    <div className="font-semibold text-sm text-indigo-400 mb-1">AI SDLC {profile === 'loop' ? 'Loop' : 'Backbone'}</div>
                    
                    <div className="mt-3 space-y-3">
                      {/* Collapsible-style steps (Trajectory) */}
                      {trajectory.length > 0 ? trajectory.map((item, idx) => (
                        <div key={item.hash} className="bg-[#141417] border border-[#27272a] rounded-lg overflow-hidden shadow-sm">
                          <div className="px-3 py-2 bg-[#1f1f22] border-b border-[#27272a] flex items-center gap-2 cursor-pointer hover:bg-[#27272a]/50 transition-colors">
                            <ChevronRight className="w-4 h-4 text-[#71717a]" />
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-sm font-medium text-[#ededef]">Commit {item.hash.slice(0, 7)}</span>
                              <span className="text-[11px] text-[#71717a] font-mono">{item.time}</span>
                            </div>
                          </div>
                          <div className="px-4 py-3 text-sm text-[#a1a1aa] font-mono whitespace-pre-wrap leading-relaxed">
                            {item.message}
                          </div>
                        </div>
                      )) : (
                        <div className="text-sm text-[#71717a] italic flex items-center gap-2">
                           <Activity className="w-4 h-4 animate-spin opacity-50" />
                           Initializing environment and scanning workspace...
                        </div>
                      )}

                      {/* Working Set / Diffs preview */}
                      {diffFiles.length > 0 && (
                        <div className="mt-4 bg-[#141417] border border-[#27272a] rounded-lg p-4 shadow-sm">
                          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#71717a] mb-3 flex items-center gap-2">
                            <FileCode2 className="w-3.5 h-3.5" /> Working Set
                          </div>
                          <div className="space-y-1.5">
                            {diffFiles.map(f => (
                              <div key={f} className="flex items-center gap-2 text-[13px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span className="font-mono text-[#d4d4d8] truncate">{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input Area (VS Code style) */}
              <div className="p-4 bg-[#141417] border-t border-[#27272a]">
                <div className="max-w-3xl mx-auto relative bg-[#1f1f22] border border-[#3f3f46] focus-within:border-indigo-500 rounded-xl overflow-hidden transition-colors shadow-sm">
                  <textarea 
                    placeholder="Ask a question or specify constraints for this session..." 
                    className="w-full bg-transparent text-[#ededef] text-sm p-4 min-h-[100px] resize-none focus:outline-none placeholder:text-[#71717a]"
                  ></textarea>
                  <div className="flex items-center justify-between px-3 py-2 bg-[#1f1f22] border-t border-[#27272a]">
                    <div className="flex items-center gap-2 text-[#71717a]">
                      <button className="p-1.5 hover:bg-[#27272a] rounded-md transition-colors" title="Attach Context">
                        <Folder className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md text-[#a1a1aa] hover:bg-[#27272a] transition-colors">
                        Cancel
                      </button>
                      <button className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors shadow-sm">
                        <Play className="w-3.5 h-3.5" /> Submit
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-center text-[10px] text-[#71717a] mt-2">
                  AI SDLC commands and changes are strictly bounded by your configured policies.
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
                  <div className="text-[#a1a1aa] text-[12px] mb-1.5 font-medium">Modified Paths</div>
                  <div className="bg-[#1f1f22] border border-[#27272a] rounded-md px-3 py-2 text-[#d4d4d8] font-mono text-[12px] shadow-sm">
                    {diffFiles.length > 0 ? diffFiles.map(f => <div key={f}>{f}</div>) : <span className="text-[#71717a]">No files modified</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[#a1a1aa] text-[12px] mb-1.5 font-medium">Goal Context</div>
                  <div className="bg-[#1f1f22] border border-[#27272a] rounded-md px-4 py-3 text-[#d4d4d8] text-[13px] shadow-sm">
                    {requestText.split('\n')[0]}
                  </div>
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
                {diffFiles.length > 0 ? diffFiles.map(f => (
                  <div key={f} className="bg-[#1f1f22] border border-[#27272a] rounded-md p-3 shadow-sm hover:border-[#3f3f46] transition-colors cursor-default">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-[12px] text-[#ededef] truncate" title={f}>{f.split('/').pop() || f}</span>
                      <span className="text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide">Loaded</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-[#71717a] text-[12px] italic">No active sources</div>
                )}
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
                    <div className="text-[#a1a1aa] font-mono text-[12px] bg-[#0e0e11] p-2 rounded border border-[#27272a]">Analyzed via Pre-commit hooks</div>
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
