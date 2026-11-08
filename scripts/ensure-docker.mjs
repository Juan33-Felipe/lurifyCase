// Comprueba que Docker responda. En Windows abre Docker Desktop si está apagado y espera a que arranque.
import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const dockerUp = () => {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

if (dockerUp()) process.exit(0);

const desktop = [
  'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
  `${process.env.LOCALAPPDATA}\\Programs\\DockerDesktop\\Docker Desktop.exe`,
].find((p) => p && existsSync(p));
if (process.platform === 'win32' && desktop) {
  console.log('Docker no está corriendo. Abriendo Docker Desktop...');
  spawn(desktop, [], { detached: true, stdio: 'ignore' }).unref();
} else {
  console.error('Docker no está corriendo. Inícialo y vuelve a ejecutar el comando.');
  process.exit(1);
}

const limit = Date.now() + 180_000;
while (Date.now() < limit) {
  await new Promise((r) => setTimeout(r, 2000));
  if (dockerUp()) {
    console.log('Docker listo.');
    process.exit(0);
  }
}
console.error('Docker no respondió en 3 minutos.');
process.exit(1);
