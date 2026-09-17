import { useState, useEffect } from 'react';
import { 
  Folder, Play, Activity, Settings, CheckCircle2, 
  Clock, AlertCircle, FileCode2, Terminal, ShieldCheck,
  ChevronRight, ArrowRight, Cpu, GitBranch, ShieldAlert, FileDiff, Zap,
  Archive
} from 'lucide-react';

type Profile = 'loop' | 'backbone';
const LOOP_STAGES = ['Specify', 'Implement', 'Test', 'Verify', 'Commit'];

export default function App() {
  const [profile, setProfile] = useState<Profile>('loop');
  const [stageIndex, setStageIndex] = useState(0);
  const [status, setStatus] = useState<'running' | 'awaiting_approval' | 'disconnected' | 'empty'>('disconnected');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [projectName, setProjectName] = useState('loading...');
  const [requestText, setRequestText] = useState('Loading request...');
  const [diffText, setDiffText] = useState('');
  const [diffFiles, setDiffFiles] = useState<string[]>([]);
  const [sessions, setSessions] = useState<{branch: string, subject: string, active: boolean}[]>([]);
  const [trajectory, setTrajectory] = useState<{hash: string, message: string, time: string}[]>([]);
  const [artifacts, setArtifacts] = useState<{name: string, path: string, type: string}[]>([]);
  const [scope, setScope] = useState<{action?: string, allowedPaths?: string[], criteria?: string[]}>({});

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
      setScope(data.scope || {});
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

  const [prompt, setPrompt] = useState('');

  const handleApprove = async () => {
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', feature: sessions.find(s => s.active)?.branch })
    });
    fetchState();
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    const branch = sessions.find(s => s.active)?.branch;
    const currentPrompt = prompt;
    setPrompt('');
    
    // Optimistic UI update
    setRequestText(currentPrompt);
    
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', feature: branch, request: currentPrompt })
    });
    fetchState();
  };

  return (
    <div className="flex h-screen w-full bg-[#0e0e11] text-[#ededef] font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Left Sidebar - Explorer / Sessions */}
      <div className="w-[280px] flex-shrink-0 bg-[#141417] border-r border-[#27272a] flex flex-col z-10 shadow-xl">
        <div className="h-12 border-b border-[#27272a] flex items-center justify-between px-4">
          <span className="font-semibold text-sm text-[#ededef] flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-400" />
            Sessions
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
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

        <div className="border-t border-[#27272a] p-4 flex flex-col gap-3">
          <button className="flex items-center justify-center gap-2 bg-[#ededef] hover:bg-white text-[#09090b] font-medium py-2 rounded-md transition-colors text-sm shadow-sm">
            <Play className="w-4 h-4" /> New Session
          </button>
        </div>
      </div>

      {/* Main Workspace (VS Code Agent Window Layout) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0e0e11] relative">
        <div className="h-12 border-b border-[#27272a] bg-[#141417] flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-medium text-[13px] text-[#ededef]">Copilot Edits Workspace</span>
            {isConnected && (
              <span className="bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold">Connected</span>
            )}
          </div>
          <button onClick={() => setIsInspectorOpen(!isInspectorOpen)} className="p-1.5 hover:bg-[#27272a] rounded transition-colors text-[#a1a1aa] hover:text-[#ededef]">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Agent Activity Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* User Request Bubble */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#1f1f22] border border-[#3f3f46] flex items-center justify-center flex-shrink-0 text-[#ededef] font-medium text-sm shadow-sm">U</div>
            <div className="pt-1 w-full max-w-4xl">
              <div className="font-semibold text-sm text-[#ededef] mb-1">User</div>
              <div className="text-sm text-[#d4d4d8] leading-relaxed whitespace-pre-wrap">{requestText}</div>
            </div>
          </div>

          {/* Agent Activity Block */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 shadow-sm relative">
              <Activity className="w-4 h-4 text-indigo-400" />
              {stageIndex > 0 && stageIndex < 5 && (
                 <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping opacity-50"></span>
              )}
            </div>
            <div className="pt-1 w-full max-w-4xl">
              <div className="font-semibold text-sm text-indigo-400 mb-1 flex items-center gap-2">
                AI SDLC {profile === 'loop' ? 'Loop' : 'Backbone'}
                <span className="text-[10px] font-normal text-[#71717a] font-mono px-1.5 py-0.5 bg-[#1f1f22] border border-[#27272a] rounded">{status}</span>
              </div>
              
              <div className="mt-3 space-y-4">
                
                {/* 1. Trajectory / Commits */}
                {trajectory.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-[#71717a] mb-2 flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5" /> Workspace Activity
                    </div>
                    {trajectory.map((item) => (
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
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[#71717a] italic flex items-center gap-2">
                     <Activity className="w-4 h-4 animate-spin opacity-50" />
                     Initializing environment and scanning workspace...
                  </div>
                )}

                {/* 2. Generated Artifacts */}
                {artifacts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-[#71717a] mb-2 flex items-center gap-2 mt-4">
                      <Archive className="w-3.5 h-3.5" /> Generated Artifacts
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {artifacts.map((art, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[#141417] border border-[#27272a] rounded-lg p-3 hover:border-[#3f3f46] transition-colors cursor-pointer shadow-sm">
                          <div className="w-8 h-8 rounded bg-[#1f1f22] border border-[#27272a] flex items-center justify-center">
                            <FileCode2 className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-[#ededef] truncate">{art.name}</div>
                            <div className="text-[11px] text-[#a1a1aa] truncate">{art.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Working Set & Inline Diffs */}
                {diffFiles.length > 0 && (
                  <div className="mt-6 bg-[#141417] border border-[#27272a] rounded-lg overflow-hidden shadow-sm">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-[#71717a] px-4 py-3 bg-[#1f1f22] border-b border-[#27272a] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileDiff className="w-3.5 h-3.5" /> Working Set
                      </div>
                      <span className="text-[#ededef] font-mono text-[10px] bg-[#27272a] px-1.5 py-0.5 rounded">{diffFiles.length} files changed</span>
                    </div>
                    
                    <div className="bg-[#0e0e11] font-mono text-[13px] overflow-x-auto p-4 max-h-[400px]">
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
                        <div className="text-[#a1a1aa] text-sm">No diff available.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Input Chat Box */}
        <div className="p-4 bg-[#141417] border-t border-[#27272a]">
          <div className="max-w-4xl mx-auto relative bg-[#1f1f22] border border-[#3f3f46] focus-within:border-indigo-500 rounded-xl overflow-hidden transition-colors shadow-sm">
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
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
                <button 
                  onClick={() => setPrompt('')}
                  className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md text-[#a1a1aa] hover:bg-[#27272a] transition-colors"
                >
                  Clear
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            </div>
          </div>
          <div className="text-center text-[10px] text-[#71717a] mt-2 max-w-4xl mx-auto">
            AI SDLC commands and changes are strictly bounded by your configured policies.
          </div>
        </div>
      </div>

      {/* Right Sidebar - Run Inspector */}
      {isInspectorOpen && (
        <div className="w-[320px] flex-shrink-0 bg-[#141417] border-l border-[#27272a] flex flex-col z-10 shadow-xl">
          <div className="h-12 border-b border-[#27272a] flex items-center px-4 shrink-0 bg-[#1f1f22]">
            <span className="font-semibold text-sm text-[#ededef]">Pipeline Inspector</span>
          </div>

          <div className="p-5 border-b border-[#27272a] shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#71717a]">Current Stage</span>
              <span className="bg-[#27272a] text-[#ededef] px-2 py-0.5 rounded text-[11px] font-medium">{stages[stageIndex]}</span>
            </div>

            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-[#27272a]"></div>
              {stages.map((stage, idx) => {
                const isActive = idx === stageIndex;
                const isPassed = idx < stageIndex;
                const isFailed = status === 'disconnected' && isActive;
                
                return (
                  <div key={stage} className={`flex items-center gap-3 mb-4 last:mb-0 relative ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-[10px] font-bold ${
                      isPassed ? 'bg-[#22c55e]/20 text-[#22c55e] ring-1 ring-[#22c55e]/50' :
                      isActive ? 'bg-indigo-500 text-white ring-2 ring-indigo-500/30' :
                      isFailed ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500/50' :
                      'bg-[#27272a] text-[#71717a]'
                    }`}>
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5"/> : (idx + 1)}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'text-[#ededef]' : 'text-[#a1a1aa]'}`}>{stage}</span>
                    {isActive && status === 'running' && (
                      <Clock className="w-3.5 h-3.5 text-indigo-400 animate-spin ml-auto" />
                    )}
                    {isActive && status === 'awaiting_approval' && (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 ml-auto" />
                    )}
                  </div>
                );
              })}
            </div>

            {status === 'awaiting_approval' && (
              <div className="mt-6 pt-5 border-t border-[#27272a]">
                <button onClick={handleApprove} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 rounded-md transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)] text-sm">
                  Approve Execution
                </button>
                <div className="text-[11px] text-[#71717a] mt-2 text-center">Requires explicit signature</div>
              </div>
            )}
            
            {status === 'completed' && (
              <div className="mt-6 pt-5 border-t border-[#27272a]">
                <div className="w-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] font-semibold py-2 rounded-md flex items-center justify-center gap-2 text-sm shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Feature Completed
                </div>
                <div className="text-[11px] text-[#71717a] mt-2 text-center">All validation gates passed</div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-[#71717a]"/>
                <h3 className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider">Scope Definition</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-[#a1a1aa] text-[12px] mb-1.5 font-medium">Modified Paths</div>
                  <div className="bg-[#1f1f22] border border-[#27272a] rounded-md px-3 py-2 text-[#d4d4d8] font-mono text-[12px] shadow-sm">
                    {(scope.allowedPaths || diffFiles).length > 0 ? (scope.allowedPaths || diffFiles).map(f => <div key={f}>{f}</div>) : <span className="text-[#71717a]">No files modified</span>}
                  </div>
                </div>
                {scope.criteria && scope.criteria.length > 0 && (
                  <div>
                    <div className="text-[#a1a1aa] text-[12px] mb-1.5 font-medium">Acceptance Criteria</div>
                    <div className="bg-[#1f1f22] border border-[#27272a] rounded-md px-3 py-2 text-[#d4d4d8] text-[12px] shadow-sm space-y-1">
                      {scope.criteria.map((c, i) => (
                         <div key={i} className="flex gap-2">
                           <span className="text-indigo-400">•</span>
                           <span>{c}</span>
                         </div>
                      ))}
                    </div>
                  </div>
                )}
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
                <Zap className="w-4 h-4 text-[#71717a]"/>
                <h3 className="text-[11px] font-bold text-[#71717a] uppercase tracking-wider">Evidence & Receipts</h3>
              </div>
              
              {artifacts.filter(a => a.name.includes('receipt') || a.name.includes('benchmark')).length > 0 ? (
                <div className="space-y-3">
                  {artifacts.filter(a => a.name.includes('receipt') || a.name.includes('benchmark')).map((art, idx) => (
                    <div key={idx} className="bg-[#1f1f22] border border-[#27272a] rounded-md p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
                        <span className="font-semibold text-[13px] text-[#ededef]">Quality Gate Passed</span>
                      </div>
                      <div className="text-[#a1a1aa] font-mono text-[12px] bg-[#0e0e11] p-2 rounded border border-[#27272a] flex justify-between items-center">
                        <span className="truncate">{art.name}</span>
                        <a href="#" className="text-indigo-400 hover:text-indigo-300 ml-2 shrink-0">View</a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1f1f22] border border-[#27272a] border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="w-6 h-6 text-[#3f3f46] mb-2" />
                  <span className="text-[13px] text-[#a1a1aa]">No evidence generated yet.</span>
                  <span className="text-[11px] text-[#71717a] mt-1">Quality gates will run during implementation.</span>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
