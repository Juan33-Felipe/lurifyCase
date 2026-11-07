// Arranca Expo apuntando la app al backend por la IP de la red local,
// para que funcione igual en web, emulador y teléfono físico con Expo Go.
// Si EXPO_PUBLIC_API_URL ya está definida, se respeta.
import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';

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

const args = process.argv.slice(2).join(' ');
const child = spawn(`npx expo start ${args}`.trim(), {
  cwd: new URL('../mobile/', import.meta.url),
  env,
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
