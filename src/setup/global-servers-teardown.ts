import fs from 'fs';

export default async function globalTeardown() {
  const pidFile = '.pw-multi-server-pids';
  if (!fs.existsSync(pidFile)) return;
  const pids = fs.readFileSync(pidFile, 'utf-8').split(/\n/).filter(Boolean).map(x => parseInt(x, 10));
  for (const pid of pids) {
    try { process.kill(pid); } catch { /* ignore */ }
  }
  fs.unlinkSync(pidFile);
}
