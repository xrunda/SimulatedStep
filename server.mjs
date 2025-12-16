import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON file path in project root
const STEP_FILE_PATH = path.join(__dirname, 'step-data.json');

// Ensure file exists with an initial value
function ensureStepFile() {
  if (!fs.existsSync(STEP_FILE_PATH)) {
    const initial = {
      steps: 0,
      timestamp: new Date().toISOString(),
    };
    fs.writeFileSync(STEP_FILE_PATH, JSON.stringify(initial, null, 2), 'utf8');
  }
}

ensureStepFile();

const server = http.createServer((req, res) => {
  // CORS headers to allow external access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Receive step updates from frontend
  if (req.method === 'POST' && req.url === '/api/steps') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const payload = {
          steps: typeof data.steps === 'number' ? data.steps : 0,
          status: data.status ?? 'UNKNOWN',
          timestamp: new Date().toISOString(),
        };

        fs.writeFile(STEP_FILE_PATH, JSON.stringify(payload, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Failed to write step-data.json:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'failed_to_write_file' }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        });
      } catch (e) {
        console.error('Invalid JSON payload:', e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'invalid_json' }));
      }
    });

    return;
  }

  // Serve the JSON file for external consumers
  if (req.method === 'GET' && req.url === '/step-data.json') {
    ensureStepFile();
    fs.readFile(STEP_FILE_PATH, 'utf8', (err, content) => {
      if (err) {
        console.error('Failed to read step-data.json:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'failed_to_read_file' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(content);
    });
    return;
  }

  // Fallback for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'not_found' }));
});

const PORT = process.env.STEP_SERVER_PORT ? Number(process.env.STEP_SERVER_PORT) : 3001;

server.listen(PORT, () => {
  console.log(`Step data server listening on http://localhost:${PORT}`);
  console.log(`Current step JSON available at http://localhost:${PORT}/step-data.json`);
});


