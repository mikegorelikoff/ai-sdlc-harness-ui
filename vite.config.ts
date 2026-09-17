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

        if (req.method === 'GET' && req.url === '/api/session') {
          try {
            const { loopScript, backboneScript } = getScripts();
            const branch = await getCurrentBranch();
            const projectName = path.basename(projectRoot);
            
            const profile = loopScript ? 'loop' : (backboneScript ? 'backbone' : 'loop');

            if (!loopScript && !backboneScript) {
              return sendJSON({
                profile,
                status: 'disconnected',
                stageIndex: 0,
                connected: false,
                projectName,
                branch
              });
            }

            try {
              let stdout = '';
              let stageIndex = 1;
              let status = 'awaiting_approval';

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

              return sendJSON({
                profile: 'loop',
                status: status,
                stageIndex,
                connected: true,
                projectName,
                branch,
                rawStatus: stdout
              });
            } catch (err) {
              // If status fails (e.g., no feature state yet)
              return sendJSON({
                profile: 'loop',
                status: 'empty',
                stageIndex: 0,
                connected: true,
                projectName,
                branch,
                rawStatus: 'No active loop state found for this feature.'
              });
            }
          } catch (err) {
            return sendJSON({ error: err.message }, 500);
          }
        }

        if (req.method === 'POST' && req.url === '/api/action') {
           let body = '';
           req.on('data', chunk => body += chunk);
           req.on('end', async () => {
             try {
               const { action } = JSON.parse(body);
               const { loopScript, backboneScript } = getScripts();
               const branch = await getCurrentBranch();
               const profile = loopScript ? 'loop' : (backboneScript ? 'backbone' : 'loop');

               if (!loopScript && !backboneScript) {
                 return sendJSON({ error: 'Not connected to Loop or Backbone environment.' }, 400);
               }

               if (action === 'approve') {
                 try {
                   if (profile === 'loop' && loopScript) {
                     await execAsync(`python3 "${loopScript}" approve --feature "${branch}" --decision approved`, { cwd: projectRoot });
                   } else if (profile === 'backbone' && backboneScript) {
                     // Simulated backbone approval (typically backbone relies on step transitions)
                     await execAsync(`python3 "${backboneScript}" --complete-state --feature "${branch}"`, { cwd: projectRoot });
                   }
                 } catch (e) {
                   console.log('Approve command output:', e.message);
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
