import { useState } from 'react';
import { 
  Folder, Play, Search, Activity, Archive, LayoutTemplate, Settings, CheckCircle2, 
  Clock, AlertCircle, AlertTriangle, FileCode2, Terminal, ShieldCheck
} from 'lucide-react';

type Profile = 'loop' | 'backbone';
type Status = 'empty' | 'loading' | 'running' | 'awaiting_approval' | 'blocked' | 'failed' | 'interrupted' | 'completed' | 'disconnected' | 'stale';

const LOOP_STAGES = [
  'Specify', 'Implementation approval', 'Implement', 
  'Engineering Quality Gate', 'Verify', 'Commit approval', 'Commit'
];

const BACKBONE_STAGES = [
  'Request', 'Explore', 'Specify', 'Plan', 'Implement', 'Verify', 'Handoff'
];

export default function App() {
  const [profile] = useState<Profile>('loop');
  const [status, setStatus] = useState<Status>('awaiting_approval');
  const [stageIndex, setStageIndex] = useState(1); // "Implementation approval" in Loop
  const [activeTab, setActiveTab] = useState('Session');
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Demo scenario state
  const [, setWebhookCode] = useState(`app.post('/webhook', (req, res) => {\n  processEvent(req.body);\n  res.status(200).send('OK');\n});`);
  const [, setScopeDrift] = useState(false);

  const stages = profile === 'loop' ? LOOP_STAGES : BACKBONE_STAGES;

  const handleApprove = () => {
    if (profile === 'loop') {
      if (stageIndex === 1) { // Implement approval
        setStatus('running');
        setStageIndex(2); // Implement
        setTimeout(() => {
          setWebhookCode(`app.post('/webhook', async (req, res) => {\n  const eventId = req.headers['x-event-id'];\n  if (await isProcessed(eventId)) return res.status(200).send('OK');\n  await processEvent(req.body);\n  await markProcessed(eventId);\n  res.status(200).send('OK');\n});`);
          setStageIndex(3); // Quality Gate
          setTimeout(() => {
            setStageIndex(4); // Verify
            setTimeout(() => {
              setStageIndex(5); // Commit approval
              setStatus('awaiting_approval');
            }, 1500);
          }, 1500);
        }, 2000);
      } else if (stageIndex === 5) { // Commit approval
        setStatus('running');
        setStageIndex(6); // Commit
        setTimeout(() => {
          setStatus('completed');
        }, 1000);
      }
    }
  };

  const handleSimulateDrift = () => {
    setScopeDrift(true);
    setStatus('stale');
  };

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#d4d4d4] font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <div className="w-[230px] flex-shrink-0 bg-[#252526] border-r border-[#333333] flex flex-col">
        <div className="p-4 border-b border-[#333333]">
          <div className="flex items-center gap-2 mb-4">
            <Folder className="w-4 h-4 text-accent" />
            <span className="font-medium truncate text-sm">ai-sdlc-harness</span>
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-blue-600 text-white py-1.5 px-3 rounded text-sm transition-colors">
            <Play className="w-3 h-3" />
            New Session
          </button>
        </div>
        
        <div className="p-2 flex-1 overflow-y-auto">
          <div className="relative mb-4">
            <Search className="w-3 h-3 absolute left-2 top-2.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search sessions..." 
              className="w-full bg-[#1e1e1e] border border-[#333333] rounded pl-7 pr-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent"
            />
          </div>
          
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider px-2">History</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-2 rounded bg-[#333333] cursor-pointer">
              <Activity className="w-3 h-3 text-amber-500" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">Webhook idempotency</div>
                <div className="text-[10px] text-gray-400">Loop • Awaiting</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded hover:bg-[#2a2a2b] cursor-pointer">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">Update README</div>
                <div className="text-[10px] text-gray-400">Backbone • Completed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 border-t border-[#333333] text-sm space-y-1">
          <div className="flex items-center gap-2 p-2 hover:bg-[#2a2a2b] rounded cursor-pointer text-gray-400"><Archive className="w-4 h-4"/> Artifacts</div>
          <div className="flex items-center gap-2 p-2 hover:bg-[#2a2a2b] rounded cursor-pointer text-gray-400"><LayoutTemplate className="w-4 h-4"/> Skills</div>
          <div className="flex items-center gap-2 p-2 hover:bg-[#2a2a2b] rounded cursor-pointer text-gray-400"><Activity className="w-4 h-4"/> Diagnostics</div>
          <div className="flex items-center gap-2 p-2 hover:bg-[#2a2a2b] rounded cursor-pointer text-gray-400"><Settings className="w-4 h-4"/> Settings</div>
        </div>
      </div>

      {/* CENTER CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-[#333333] flex items-center px-6 justify-between bg-[#1e1e1e]">
          <div>
            <h1 className="text-base font-semibold text-white">Webhook idempotency</h1>
            <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
              <span>Branch: <span className="font-mono text-[#d4d4d4]">feature/webhook-idempotency</span></span>
              <span>•</span>
              <span>Profile: <span className="text-[#d4d4d4] capitalize">{profile}</span></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {status === 'awaiting_approval' && <Clock className="w-3 h-3 text-amber-500" />}
                {status === 'running' && <Activity className="w-3 h-3 text-blue-500" />}
                {status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                {status === 'stale' && <AlertCircle className="w-3 h-3 text-red-500" />}
                <span className={`capitalize ${status === 'stale' ? 'text-red-400' : ''}`}>{status.replace('_', ' ')}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-amber-900/30 text-amber-500 border border-amber-900/50 rounded text-xs font-mono">Demo / Not connected</div>
             <button onClick={() => setIsInspectorOpen(!isInspectorOpen)} className="p-1.5 hover:bg-[#333333] rounded">
               <LayoutTemplate className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Workflow Bar */}
        <div className="px-6 py-3 border-b border-[#333333] bg-[#1e1e1e]">
          <div className="flex items-center justify-between text-xs">
            {stages.map((stage, idx) => (
              <div key={stage} className="flex flex-col items-center flex-1 relative">
                <div className={`w-full h-1 absolute top-1.5 -z-10 ${idx === 0 ? 'rounded-l' : ''} ${idx === stages.length - 1 ? 'rounded-r' : ''} ${idx < stageIndex ? 'bg-green-600' : idx === stageIndex ? 'bg-accent' : 'bg-[#333333]'}`}></div>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${idx < stageIndex ? 'bg-green-600 border-green-600' : idx === stageIndex ? 'bg-[#1e1e1e] border-accent text-accent' : 'bg-[#1e1e1e] border-[#404040]'}`}>
                  {idx < stageIndex && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`mt-2 text-center px-1 ${idx === stageIndex ? 'text-white font-medium' : 'text-gray-500'}`}>{stage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action bar */}
        {(status === 'awaiting_approval' || status === 'stale') && (
          <div className={`px-6 py-3 border-b border-[#333333] flex items-center justify-between ${status === 'stale' ? 'bg-red-900/10' : 'bg-amber-900/10'}`}>
            <div className="flex items-center gap-3 text-sm">
              {status === 'stale' ? <AlertCircle className="text-red-500 w-5 h-5"/> : <AlertTriangle className="text-amber-500 w-5 h-5"/>}
              <span>
                {status === 'stale' ? "Approval stale due to scope drift. Please re-review." : 
                  (stageIndex === 1 ? "Implementation requires explicit approval. Review allowed paths and specification." : "Commit requires explicit approval. Review diff and evidence.")}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSimulateDrift} className="px-3 py-1.5 text-sm hover:bg-[#333333] rounded">Request changes</button>
              <button 
                onClick={handleApprove}
                className="px-3 py-1.5 text-sm bg-accent hover:bg-blue-600 text-white rounded font-medium disabled:opacity-50"
              >
                {status === 'stale' ? 'Re-approve' : (stageIndex === 1 ? 'Approve implementation' : 'Approve commit')}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex px-6 border-b border-[#333333]">
          {['Session', 'Trajectory', 'Changes', 'Artifacts'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-accent text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'Session' && (
            <div className="max-w-3xl space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center flex-shrink-0">U</div>
                <div className="pt-1 text-sm text-gray-200">
                  <p>Add idempotent webhook processing without changing the public API.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">A</div>
                <div className="pt-1 space-y-3 w-full">
                  <div className="text-sm text-gray-300">
                    I've examined the <code>src/webhook.js</code> file. I plan to use the <code>x-event-id</code> header to check a local store before processing.
                  </div>
                  <div className="bg-[#1e1e1e] border border-[#333333] rounded p-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <FileCode2 className="w-4 h-4" />
                      <span>Specification generated</span>
                    </div>
                    <p className="mb-2">Fingerprint: <span className="font-mono text-xs bg-[#333333] px-1 rounded">f9a3b2c1</span></p>
                    <a href="#" className="text-accent hover:underline">View TOON spec</a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Trajectory' && (
            <div className="max-w-3xl border-l border-[#333333] ml-4 pl-6 space-y-6 relative">
              <div className="relative">
                <div className="absolute -left-[31px] bg-[#1e1e1e] p-1"><Terminal className="w-4 h-4 text-gray-400"/></div>
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">grep_search</span>
                    <span className="text-xs text-gray-500">2s • Exit 0</span>
                  </div>
                  <div className="bg-[#1e1e1e] p-2 rounded border border-[#333333] font-mono text-xs text-gray-400">
                    Query: app.post('/webhook'<br/>Path: src/
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] bg-[#1e1e1e] p-1"><ShieldCheck className="w-4 h-4 text-green-500"/></div>
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">Scope check</span>
                    <span className="text-xs text-gray-500">1s • Pass</span>
                  </div>
                  <p className="text-gray-400">Paths bounded to <code>src/webhook.js</code></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Changes' && (
            <div className="max-w-4xl space-y-4">
              <div className="border border-[#333333] rounded overflow-hidden">
                <div className="bg-[#252526] px-4 py-2 border-b border-[#333333] flex justify-between items-center text-sm">
                  <span className="font-mono text-gray-300">src/webhook.js</span>
                  <span className="text-green-500 bg-green-900/20 px-2 py-0.5 rounded text-xs border border-green-900/50">Allowed path</span>
                </div>
                <div className="p-4 bg-[#1e1e1e] font-mono text-sm overflow-x-auto whitespace-pre">
                  {stageIndex >= 3 ? (
                    <div>
                      <span className="text-red-400">- app.post('/webhook', (req, res) =&gt; {'{'}</span><br/>
                      <span className="text-red-400">-   processEvent(req.body);</span><br/>
                      <span className="text-green-400">+ app.post('/webhook', async (req, res) =&gt; {'{'}</span><br/>
                      <span className="text-green-400">+   const eventId = req.headers['x-event-id'];</span><br/>
                      <span className="text-green-400">+   if (await isProcessed(eventId)) return res.status(200).send('OK');</span><br/>
                      <span className="text-green-400">+   await processEvent(req.body);</span><br/>
                      <span className="text-green-400">+   await markProcessed(eventId);</span><br/>
                      <span className="text-gray-400">    res.status(200).send('OK');</span><br/>
                      <span className="text-gray-400">  {'}'});</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">No diff available. Awaiting implementation approval.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Artifacts' && (
            <div className="grid grid-cols-2 gap-4 max-w-4xl">
              <div className="border border-[#333333] rounded p-4 bg-[#252526] hover:border-gray-500 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <FileCode2 className="w-4 h-4 text-accent" />
                  <span className="font-medium text-sm text-white">spec.toon</span>
                </div>
                <div className="text-xs text-gray-400 mb-3 line-clamp-2">Implementation specification for webhook idempotency.</div>
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                  <span className="font-mono bg-[#1e1e1e] px-1 rounded">f9a3b2c1</span>
                  <span>Just now</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT INSPECTOR */}
      {isInspectorOpen && (
        <div className="w-[340px] flex-shrink-0 bg-[#252526] border-l border-[#333333] flex flex-col">
          <div className="h-14 border-b border-[#333333] flex items-center px-4 font-medium text-sm text-white">
            Run Inspector
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            <section>
              <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Scope</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Action</div>
                  <div className="bg-[#1e1e1e] border border-[#333333] rounded p-2 text-gray-300">Implement & Verify</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Allowed Paths</div>
                  <div className="bg-[#1e1e1e] border border-[#333333] rounded p-2 text-gray-300 font-mono text-xs">
                    src/webhook.js<br/>
                    tests/webhook.test.js
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Acceptance Criteria</div>
                  <ul className="list-disc pl-4 text-gray-300 space-y-1 text-xs">
                    <li>Duplicate webhook IDs return 200 OK without processing</li>
                    <li>Public API contract unchanged</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Context Sources</h3>
              <div className="space-y-2">
                <div className="bg-[#1e1e1e] border border-[#333333] rounded p-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-gray-300 truncate">src/webhook.js</span>
                    <span className="text-green-500">Fresh</span>
                  </div>
                  <div className="text-gray-500">Loaded via Explore stage</div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Evidence</h3>
              {stageIndex >= 4 ? (
                <div className="space-y-2">
                  <div className="bg-[#1e1e1e] border border-[#333333] rounded p-2 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-gray-300">Engineering Quality Gate</span>
                    </div>
                    <div className="text-gray-500 font-mono">0 High, 0 Medium findings</div>
                  </div>
                  <div className="bg-[#1e1e1e] border border-[#333333] rounded p-2 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-gray-300">npm test webhook.test.js</span>
                    </div>
                    <div className="text-gray-500 font-mono text-[10px]">
                      PASS tests/webhook.test.js<br/>
                      ✓ process event (12ms)<br/>
                      ✓ ignore duplicate (8ms)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No evidence generated yet.</div>
              )}
            </section>

          </div>
        </div>
      )}
    </div>
  );
}
