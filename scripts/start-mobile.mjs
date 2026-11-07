// Arranca Expo apuntando la app al backend por la IP de la red local,
// para que funcione igual en web, emulador y teléfono físico con Expo Go.
// Si EXPO_PUBLIC_API_URL ya está definida, se respeta.
import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const lanIp = () => {
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    if (/vEthernet|WSL|Docker|VirtualBox|VMware|Loopback/i.test(name)) continue;
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address;
    }
  }
  return 'localhost';
};

const env = { ...process.env };
if (!env.EXPO_PUBLIC_API_URL) {
  env.EXPO_PUBLIC_API_URL = `http://${lanIp()}:8080/api/v1`;
}
console.log(`API de la app: ${env.EXPO_PUBLIC_API_URL}`);

// Se llama al CLI de Expo con Node directamente, sin npx, para no heredar avisos de npm/pnpm.
const mobile = fileURLToPath(new URL('../mobile/', import.meta.url));
const cli = join(mobile, 'node_modules', 'expo', 'bin', 'cli');
const child = spawn(process.execPath, [cli, 'start', ...process.argv.slice(2)], {
  cwd: mobile,
  env,
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 0));
