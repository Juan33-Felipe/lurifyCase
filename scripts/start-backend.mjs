// Arranca el backend con el Maven Wrapper del repo, así no hace falta tener Maven instalado.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Ruta absoluta: Windows puede tener desactivada la búsqueda de ejecutables en la carpeta actual.
const backend = fileURLToPath(new URL('../backend/', import.meta.url));
const mvnw = join(backend, process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw');
const child = spawn(`"${mvnw}" -q spring-boot:run`, {
  cwd: backend,
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
