// Libera los puertos del entorno de desarrollo antes de arrancar.
// Solo cierra procesos que son una instancia vieja de este proyecto (backend de Iurify Case o Expo de mobile/).
// Si el puerto lo ocupa otro programa, no lo toca y termina con un mensaje claro.
import { execSync } from 'node:child_process';

const PORTS = { 8080: 'backend', 8081: 'Expo' };
const isOurs = (cmd) => /IurifyCaseApplication/.test(cmd) || /lurifyCase[\/]mobile[\/]node_modules/i.test(cmd);
const sh = (c) => execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

const ownerWin = (port) => {
  const ps = (c) => sh(`powershell -NoProfile -Command "${c}"`);
  const pid = ps(`(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess`);
  if (!pid) return null;
  return { pid, cmd: ps(`(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine`) };
};

const ownerUnix = (port) => {
  try {
    const pid = sh(`lsof -ti tcp:${port} -sTCP:LISTEN`).split('\n')[0];
    return pid ? { pid, cmd: sh(`ps -o command= -p ${pid}`) } : null;
  } catch {
    return null;
  }
};

const win = process.platform === 'win32';
let blocked = false;
for (const [port, name] of Object.entries(PORTS)) {
  const owner = win ? ownerWin(port) : ownerUnix(port);
  if (!owner) continue;
  if (isOurs(owner.cmd)) {
    console.log(`Puerto ${port} ocupado por una instancia vieja del ${name} (PID ${owner.pid}). Cerrándola...`);
    sh(win ? `taskkill /PID ${owner.pid} /T /F` : `kill ${owner.pid}`);
  } else {
    console.error(`El puerto ${port} (${name}) lo usa otro programa, PID ${owner.pid}: ${owner.cmd.slice(0, 120)}`);
    blocked = true;
  }
}
if (blocked) process.exit(1);
