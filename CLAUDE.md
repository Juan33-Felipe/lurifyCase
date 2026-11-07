# Iurify Case — Monorepo

Monorepo con dos proyectos:

- `backend/` — API REST en Java 17 + Spring Boot + Maven. Contrato en `backend/openapi.yaml`.
- `mobile/` — App Expo / React Native con NativeWind. **Lee `mobile/AGENTS.md` antes de tocar cualquier cosa en `mobile/`.**

## REGLA OBLIGATORIA: cada cambio es un commit

Esta regla no tiene excepciones.

1. **Cada cambio que hagas termina en un commit**, en el mismo turno en que lo haces. Nunca dejes cambios sin commitear al terminar una tarea ni entre tareas.
2. **Un commit por cambio lógico.** Si una tarea tiene varios cambios independientes (por ejemplo, un fix en `backend/` y un ajuste de UI en `mobile/`), haz un commit por cada uno. No mezcles backend y mobile en el mismo commit salvo que el cambio sea uno solo y no se pueda separar (por ejemplo, cambiar un contrato de la API y su consumidor a la vez).
3. **Commitea antes de pasar al siguiente cambio.** No acumules varios cambios para commitearlos juntos al final.
4. **Antes de commitear**, revisa `git status` y `git diff --staged`. Agrega solo los archivos de ese cambio (`git add <rutas>`), nunca `git add -A` a ciegas. Nunca commitees `.env`, credenciales ni artefactos de build.
5. **Si un cambio rompe algo**, el arreglo va en un commit nuevo. No uses `--amend`, `rebase` ni `reset` sobre commits ya hechos salvo que el usuario lo pida.
6. **Commit ≠ push.** No hagas `git push` ni crees PRs salvo que el usuario lo pida.
7. **Al final de cada tarea**, informa al usuario los commits creados (hash corto + mensaje).

### Formato del mensaje

Conventional Commits, en inglés, como ya usa el historial:

```
<tipo>(<alcance>): <descripción en imperativo, minúscula, sin punto>
```

- **tipo:** `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `build`, `chore`, `perf`, `ci`.
- **alcance:** el área afectada. Usa `backend` o `mobile` como alcance, o un alcance más fino precedido del proyecto si ayuda (por ejemplo `mobile/settings`, `backend/auth`). Para cambios en la raíz del monorepo usa `repo`.

Ejemplos:

```
feat(backend/auth): add refresh token endpoint
fix(mobile/canvas): prevent node drag from scrolling the screen
docs(repo): document how to run both projects
```

## Verificación antes de commitear

- `backend/`: `mvn -q test` (o al menos `mvn -q compile` si no hay tests relacionados).
- `mobile/`: `npx expo lint` y `npx tsc --noEmit`.

Si la verificación falla por un problema preexistente que no causaste, commitea igual tu cambio y avisa al usuario del fallo con la salida del error.
