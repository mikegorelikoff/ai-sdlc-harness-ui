import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Thin Backend Adapter for AI SDLC
function aiSdlcApiPlugin() {
  return {
    name: 'ai-sdlc-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const projectRoot = path.resolve(process.cwd(), '../..'); // up from products/ai-sdlc-harness-ui to project root
        
        // Helper to send JSON
        const sendJSON = (data, status = 200) => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = status;
          res.end(JSON.stringify(data));
        };

        // Endpoint: Get current session status
        if (req.method === 'GET' && req.url === '/api/session') {
          try {
            // Check for loop install or harness install
            const isLoop = fs.existsSync(path.join(projectRoot, '.ai-sdlc-loop'));
            const isBackbone = fs.existsSync(path.join(projectRoot, '.ai-sdlc'));
            
            if (!isLoop && !isBackbone) {
              return sendJSON({
                profile: 'loop',
                status: 'empty',
                stageIndex: 0,
                connected: false,
                projectName: path.basename(projectRoot)
              });
            }

            // In a real integration, we parse .ai-sdlc/state.toon or .ai-sdlc-loop/install/state.json
            // For now, we simulate reading a real state file if we were to parse it.
            // Let's create a dummy state file in the project root just to prove it's reading from FS
            const stateFile = path.join(projectRoot, '.ai-sdlc', 'ui-state.json');
            let state = {
              profile: isLoop ? 'loop' : 'backbone',
              status: 'awaiting_approval',
              stageIndex: 1,
              connected: true,
              projectName: path.basename(projectRoot),
              scope: {
                action: 'Implement & Verify',
                allowedPaths: ['src/webhook.js', 'tests/webhook.test.js'],
                criteria: ['Duplicate webhook IDs return 200 OK without processing']
              }
            };

            if (fs.existsSync(stateFile)) {
               state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
            } else {
               fs.mkdirSync(path.dirname(stateFile), { recursive: true });
               fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
            }

            return sendJSON(state);
          } catch (err) {
            return sendJSON({ error: err.message }, 500);
          }
        }

        // Endpoint: Perform action
        if (req.method === 'POST' && req.url === '/api/action') {
           let body = '';
           req.on('data', chunk => body += chunk);
           req.on('end', () => {
             try {
               const { action } = JSON.parse(body);
               const stateFile = path.join(projectRoot, '.ai-sdlc', 'ui-state.json');
               let state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));

               if (action === 'approve') {
                 if (state.stageIndex === 1) {
                    state.status = 'running';
                    state.stageIndex = 2;
                    // Trigger async progression (mocking real backend work)
                    setTimeout(() => {
                       state.stageIndex = 4;
                       state.status = 'awaiting_approval';
                       state.stageIndex = 5;
                       fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
                    }, 3000);
                 } else if (state.stageIndex === 5) {
                    state.status = 'running';
                    state.stageIndex = 6;
                    setTimeout(() => {
                       state.status = 'completed';
                       fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
                    }, 2000);
                 }
               } else if (action === 'drift') {
                 state.status = 'stale';
               }

               fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
               return sendJSON(state);
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
