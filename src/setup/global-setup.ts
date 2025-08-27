import { spawn, ChildProcess, execSync } from 'child_process';
import * as http from 'http';
import * as path from 'path';

async function waitForServer(url: string, timeoutMs = 15000, intervalMs = 300) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise<boolean>((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) return true;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Server not reachable at ${url} after ${timeoutMs}ms`);
}

export default async function globalSetup() {
  const baseUrl = 'http://127.0.0.1:3000/api/tasks';
  // Always attempt to free the port first as requested
  try {
    const pidsRaw = execSync('lsof -ti tcp:3000 || true', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (pidsRaw) {
      const pids = pidsRaw.split(/\n+/).filter(Boolean);
      console.log(`[globalSetup] Detected existing processes on :3000 -> ${pids.join(', ')}`);
      for (const pid of pids) {
        try {
          process.kill(parseInt(pid), 'SIGKILL');
          console.log(`[globalSetup] Killed PID ${pid}`);
        } catch (e) {
          console.warn(`[globalSetup] Failed to kill PID ${pid}`, e);
        }
      }
      // Small delay to allow OS to release the port
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (e) {
    console.warn('[globalSetup] Failed to inspect/kill existing port 3000 processes', e);
  }

  let alreadyRunning = false; // We force restart; set false so we always spawn below

  let child: ChildProcess | undefined;
  if (!alreadyRunning) {
    console.log('[globalSetup] Starting test-platform server...');
    const serverFile = path.join(process.cwd(), 'test-platform', 'server.js');
    child = spawn(process.execPath, [serverFile], {
      stdio: 'inherit',
      env: { ...process.env },
      cwd: path.join(process.cwd(), 'test-platform'),
    });
    // Wait for it to be ready
    try {
      await waitForServer(baseUrl);
      console.log('[globalSetup] Server started. PID:', child.pid);
    } catch (e) {
      console.error('[globalSetup] Failed to verify server startup', e);
    }
  }
  return { serverPid: child?.pid, started: !alreadyRunning };
}

export type GlobalSetupState = { serverPid?: number; started: boolean };