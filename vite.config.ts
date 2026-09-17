import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

function aiSdlcApiPlugin() {
  return {
    name: 'ai-sdlc-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Production Host Adapter
        // It looks for the target project where the UI was started.
        // In this harness workspace, the target project is typically the parent directory.
        const projectRoot = path.resolve(process.cwd(), '../..');
        
        const sendJSON = (data, status = 200) => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = status;
          res.end(JSON.stringify(data));
        };

        const getScripts = () => {
          const loopPaths = [
            path.join(projectRoot, '.agents', 'skills', 'ai-sdlc-loop-shared-runtime', 'scripts', 'loop.py'),
            path.join(projectRoot, '.ai-sdlc-loop', 'skills', 'ai-sdlc-loop-shared-runtime', 'scripts', 'loop.py'),
            path.join(projectRoot, 'products', 'ai-sdlc-loop', 'skills', 'ai-sdlc-loop-shared-runtime', 'scripts', 'loop.py')
          ];
          const backbonePaths = [
            path.join(projectRoot, '.agents', 'skills', 'ai-sdlc-shared-runtime', 'scripts', 'ai_sdlc_steps.py'),
            path.join(projectRoot, '.ai-sdlc', 'skills', 'ai-sdlc-shared-runtime', 'scripts', 'ai_sdlc_steps.py'),
            path.join(projectRoot, 'skills', 'ai-sdlc-shared-runtime', 'scripts', 'ai_sdlc_steps.py')
          ];
          return {
            loopScript: loopPaths.find(p => fs.existsSync(p)),
            backboneScript: backbonePaths.find(p => fs.existsSync(p))
          };
        };

        const getCurrentBranch = async () => {
          try {
            const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: projectRoot });
            return stdout.trim();
          } catch (e) {
            return 'unknown';
          }
        };

        const getRepoData = async (branch) => {
          let requestText = 'Loading...';
          let diffText = '';
          let files = [];
          try {
             const { stdout: diffOut } = await execAsync('git diff HEAD~1', { cwd: projectRoot });
             diffText = diffOut;
             const { stdout: nameOut } = await execAsync('git log -1 --pretty=%B', { cwd: projectRoot });
             requestText = nameOut.trim();
             const { stdout: filesOut } = await execAsync('git diff HEAD~1 --name-only', { cwd: projectRoot });
             files = filesOut.split('\n').filter(Boolean);
          } catch (e) {
             requestText = 'No request context available.';
          }
          return { requestText, diffText, files };
        };

        const getSessions = async () => {
          try {
            const { stdout } = await execAsync('git for-each-ref --sort=-committerdate refs/heads/ --format="%(refname:short)|%(contents:subject)"', { cwd: projectRoot });
            return stdout.split('\n').filter(Boolean).map(line => {
              const [branch, subject] = line.split('|');
              return { branch, subject, active: false };
            });
          } catch (e) {
            return [];
          }
        };

        const getTrajectory = async (branch) => {
          try {
            const { stdout } = await execAsync('git log -n 5 --pretty=format:"%h|%s|%ar"', { cwd: projectRoot });
            return stdout.split('\n').filter(Boolean).map(line => {
              const [hash, message, time] = line.split('|');
              return { hash, message, time };
            });
          } catch (e) {
            return [];
          }
        };

        const getArtifacts = async () => {
          try {
            const { stdout } = await execAsync('find .ai-sdlc .ai-sdlc-loop .agents -name "*.toon" -o -name "*.md" -type f 2>/dev/null | head -n 10', { cwd: projectRoot });
            return stdout.split('\n').filter(Boolean).map(f => ({
              name: path.basename(f),
              path: f,
              type: f.endsWith('.toon') ? 'TOON Spec' : 'Markdown'
            }));
          } catch (e) {
            return [];
          }
        };

        if (req.method === 'GET' && req.url === '/api/session') {
          try {
            const { loopScript, backboneScript } = getScripts();
            const branch = await getCurrentBranch();
            const projectName = path.basename(projectRoot);
            
            const profile = loopScript ? 'loop' : (backboneScript ? 'backbone' : 'loop');
            const repoData = await getRepoData(branch);
            const sessions = await getSessions();
            const artifacts = await getArtifacts();
            const trajectory = await getTrajectory(branch);

            let stateData = {};
            try {
              const statePath = path.join(projectRoot, '.ai-sdlc', 'ui-state.json');
              if (fs.existsSync(statePath)) {
                stateData = JSON.parse(fs.readFileSync(statePath, 'utf8'));
              }
            } catch(e) {}

            const mappedSessions = sessions.map(s => ({ ...s, active: s.branch === branch }));

            if (!loopScript && !backboneScript) {
              return sendJSON({
                profile,
                status: 'disconnected',
                stageIndex: 0,
                connected: false,
                projectName,
                branch,
                sessions: mappedSessions,
                artifacts,
                trajectory,
                ...repoData,
                ...stateData
              });
            }

            try {
              let stdout = '';
              let stageIndex = stateData.stageIndex ?? 1;
              let status = stateData.status ?? 'awaiting_approval';

              if (!stateData.status) {
                if (profile === 'loop' && loopScript) {
                  const result = await execAsync(`python3 "${loopScript}" status --feature "${branch}"`, { cwd: projectRoot });
                  stdout = result.stdout;
                  if (stdout.includes('Verify')) stageIndex = 4;
                  else if (stdout.includes('Implement')) stageIndex = 2;
                  else if (stdout.includes('Commit')) stageIndex = 5;
                } else if (profile === 'backbone' && backboneScript) {
                  const result = await execAsync(`python3 "${backboneScript}" --state-check --feature "${branch}"`, { cwd: projectRoot });
                  stdout = result.stdout;
                  if (stdout.includes('plan')) stageIndex = 3;
                  else if (stdout.includes('implement')) stageIndex = 4;
                  else if (stdout.includes('verify')) stageIndex = 5;
                  else if (stdout.includes('handoff')) stageIndex = 6;
                }
              }

              return sendJSON({
                profile,
                status,
                stageIndex,
                connected: true,
                projectName,
                branch,
                rawStatus: stdout,
                sessions: mappedSessions,
                artifacts,
                trajectory,
                ...repoData,
                ...stateData
              });
            } catch (err) {
              return sendJSON({
                profile,
                status: stateData.status ?? 'empty',
                stageIndex: stateData.stageIndex ?? 0,
                connected: true,
                projectName,
                branch,
                rawStatus: 'No active state found for this feature.',
                sessions: mappedSessions,
                artifacts,
                trajectory,
                ...repoData,
                ...stateData
              });
            }
          } catch (err) {
            return sendJSON({ error: err.message }, 500);
          }
        }

        if (req.method === 'POST' && req.url === '/api/switch-branch') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { branch } = JSON.parse(body);
              await execAsync(`git checkout ${branch}`, { cwd: projectRoot });
              return sendJSON({ success: true });
            } catch (e) {
              return sendJSON({ error: e.message }, 500);
            }
          });
          return;
        }

        if (req.method === 'POST' && req.url === '/api/action') {
           let body = '';
           req.on('data', chunk => body += chunk);
           req.on('end', async () => {
             try {
               const { action, feature, request } = JSON.parse(body);
               const { loopScript, backboneScript } = getScripts();
               const branch = feature || await getCurrentBranch();
               const profile = loopScript ? 'loop' : 'backbone';

               if (!loopScript && !backboneScript) {
                 return sendJSON({ error: 'Not connected to Loop or Backbone environment.' }, 400);
               }

               if (action === 'approve') {
                 try {
                   if (profile === 'loop' && loopScript) {
                     await execAsync(`python3 "${loopScript}" approve --feature "${branch}" --decision approved`, { cwd: projectRoot });
                   } else if (profile === 'backbone' && backboneScript) {
                     await execAsync(`python3 "${backboneScript}" --complete-state --feature "${branch}"`, { cwd: projectRoot });
                   }
                 } catch (e) {
                   console.log('Approve command output:', e.message);
                 }
               } else if (action === 'submit' && request) {
                 try {
                   if (profile === 'loop' && loopScript) {
                     await execAsync(`python3 "${loopScript}" specify --feature "${branch}" --request "${request.replace(/"/g, '\\"')}" --allow "*"`, { cwd: projectRoot });
                   } else if (profile === 'backbone' && backboneScript) {
                     await execAsync(`python3 "${backboneScript}" --goal "${request.replace(/"/g, '\\"')}" --feature "${branch}"`, { cwd: projectRoot });
                   }
                 } catch (e) {
                   console.log('Submit command output:', e.message);
                 }
               }
               return sendJSON({ success: true });
             } catch(err) {
               return sendJSON({ error: err.message }, 500);
             }
           });
           return;
        }

        res.statusCode = 404;
        res.end('Not Found');
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), aiSdlcApiPlugin()],
});
