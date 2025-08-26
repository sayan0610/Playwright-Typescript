import { GlobalSetupState } from './global-setup';

export default async function globalTeardown(state: GlobalSetupState) {
  if (state?.started && state.serverPid) {
    console.log('[globalTeardown] Stopping test-platform server PID', state.serverPid);
    try {
      process.kill(state.serverPid);
    } catch (e) {
      console.warn('[globalTeardown] Failed to kill server process', e);
    }
  } else {
    console.log('[globalTeardown] No server process to stop (was reused).');
  }
}