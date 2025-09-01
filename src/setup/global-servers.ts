import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import net from 'net';
import { FullConfig } from '@playwright/test';

// Map project name -> port
const projectPorts: Record<string, number> = {
  chromium: 3101,
  firefox: 3102,
  webkit: 3103,
};

const servers: ChildProcess[] = [];

async function waitOn(port: number, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.on('connect', () => { socket.end(); resolve(); });
      socket.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout waiting for port ${port}`));
        setTimeout(tryConnect, 200);
      });
    };
    tryConnect();
  });
}

export default async function globalSetup(config: FullConfig) {
  // Spawn one server per project up front
  for (const project of config.projects) {
    const name = project.name;
    const port = projectPorts[name];
    if (!port) continue;
    const env = { ...process.env, PORT: String(port) };
    const serverPath = path.join(process.cwd(), 'sample-app', 'server.js');
    const cp = spawn('node', [serverPath], { env, stdio: 'inherit' });
    servers.push(cp);
    await waitOn(port);
  }
  // Persist PIDs into a temp file for teardown
  const meta = servers.map(s => s.pid).filter(Boolean).join('\n');
  const fs = await import('fs');
  fs.writeFileSync('.pw-multi-server-pids', meta, 'utf-8');
}
