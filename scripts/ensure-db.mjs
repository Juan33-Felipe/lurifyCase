// Prepara la base de datos según DB_URL (variable de entorno o backend/.env).
// Si apunta a localhost, levanta PostgreSQL en Docker. Si apunta a otro host (por ejemplo Neon), no hace nada.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../backend/.env', import.meta.url));
const fromFile = () => {
  if (!existsSync(envFile)) return undefined;
  const line = readFileSync(envFile, 'utf8').split(/\r?\n/).find((l) => /^\s*DB_URL\s*=/.test(l));
  return line?.split('=').slice(1).join('=').trim();
};

const url = process.env.DB_URL || fromFile() || 'jdbc:postgresql://localhost:5432/iurify_case_db';
const host = url.match(/\/\/([^/:?]+)/)?.[1] ?? 'localhost';

if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
  console.log(`Base de datos remota: ${host}. No se levanta Docker.`);
  process.exit(0);
}

const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: fileURLToPath(new URL('..', import.meta.url)) });
run('node scripts/ensure-docker.mjs');
run('docker compose -f backend/docker-compose.yml up -d --wait');
