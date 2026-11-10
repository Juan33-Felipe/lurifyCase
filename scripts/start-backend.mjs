// Arranca el backend con el jar empaquetado si existe, o con el Maven Wrapper del repo.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const backend = fileURLToPath(new URL('../backend/', import.meta.url));
const jarPath = join(backend, 'target', 'iurifycase-backend-0.0.1-SNAPSHOT.jar');
const mvnw = join(backend, process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw');

const cmd = existsSync(jarPath)
  ? `java -jar "${jarPath}"`
  : `"${mvnw}" -q spring-boot:run`;

const child = spawn(cmd, {
  cwd: backend,
  stdio: ['ignore', 'inherit', 'inherit'],
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
