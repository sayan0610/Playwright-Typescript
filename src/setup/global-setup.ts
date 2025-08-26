import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

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
  const baseUrl = 'http://localhost:3000/api/tasks';
  // First check if server already running
  let alreadyRunning = false;
  try {
    await waitForServer(baseUrl, 1000, 200);
    alreadyRunning = true;
    console.log('[globalSetup] Reusing existing test-platform server.');
  } catch {
    // need to start
  }

  let child: ChildProcess | undefined;
  if (!alreadyRunning) {
    console.log('[globalSetup] Starting test-platform server...');
    child = spawn(process.execPath, ['test-platform/server.js'], {
      stdio: 'inherit',
      env: { ...process.env },
    });
    // Wait for it to be ready
    await waitForServer(baseUrl);
    console.log('[globalSetup] Server started. PID:', child.pid);
  }
  return { serverPid: child?.pid, started: !alreadyRunning };
}

export type GlobalSetupState = { serverPid?: number; started: boolean };