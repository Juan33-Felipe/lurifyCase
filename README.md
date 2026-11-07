# Iurify Case

Aplicación **Iurify Case**, diseñada para la gestión de expedientes y la construcción de teorías del caso mediante interacción conversacional (voz/texto), renderización de lienzos visuales interactivos y asistencia de Inteligencia Artificial.

Este repositorio es un monorepo con el backend y la app móvil.

| Carpeta | Contenido | Stack |
|---|---|---|
| [`backend/`](backend/) | API REST, base de datos, contrato OpenAPI | Java 17, Spring Boot 3.4, Maven, PostgreSQL 15 (Docker) |
| [`mobile/`](mobile/) | App móvil | React Native, Expo, NativeWind |

---
## Especificación de Requisitos

### Requisitos Funcionales (FR)
* **RF-001 (Ingesta Conversacional):** El sistema debe permitir al usuario dictar por voz o ingresar por texto la descripción de los hechos, medios probatorios y objetivos de un caso jurídico.
* **RF-002 (Generación Automática del Lienzo):** El sistema debe analizar la narrativa ingresada mediante IA y generar automáticamente un lienzo visual, extrayendo y categorizando la información en nodos (Hechos, Pruebas, Leyes, Jurisprudencia).
* **RF-003 (Edición Manual del Lienzo):** El sistema debe permitir al usuario interactuar manualmente con el lienzo generado para añadir nuevos nodos, editar el texto de los existentes, eliminar nodos y modificar las relaciones (enlaces) entre ellos.
* **RF-004 (Auditoría de IA en Tiempo Real):** El sistema debe incluir una función de auditoría que analice el estado actual del lienzo y genere alertas visuales o textuales sobre vacíos procesales, contradicciones lógicas o debilidades en la teoría del caso frente a posturas de contraparte.
* **RF-005 (Generación de Documentos Técnicos):** El sistema debe permitir al usuario solicitar, mediante comandos conversacionales, la redacción de documentos jurídicos (minutas, alegatos, conceptos) basados en la estructura actual del lienzo.
* **RF-006 (Exportación de Documentos):** El sistema debe compilar los documentos generados y permitir su descarga o exportación en formatos estándar (PDF, Word).
* **RF-007 (Gestión de Expedientes):** El sistema debe permitir crear, guardar, editar y eliminar múltiples casos o expedientes, conservando el historial conversacional y el estado del lienzo de cada uno.
* **RF-008 (Autenticación y Control de Acceso):** El sistema debe requerir que el usuario se autentique de forma segura (credenciales o biometría) para garantizar la privacidad y el secreto profesional de los expedientes.

### Requisitos No Funcionales (NFR)
* **RNF-001 (Rendimiento NLP):** La transcripción de voz a texto y la primera respuesta de la IA (generación del lienzo inicial) deben completarse en un tiempo óptimo para mantener la fluidez en el flujo de trabajo del abogado.
* **RNF-002 (Usabilidad Móvil):** La interfaz del lienzo visual debe soportar interacciones táctiles nativas (zoom, arrastrar nodos) optimizadas para pantallas de smartphones.
* **RNF-003 (Disponibilidad Offline Parcial):** El sistema debe permitir visualizar el último estado guardado de los expedientes locales sin requerir conexión constante a internet.
* **RNF-004 (Seguridad y Privacidad):** Todos los datos de las conversaciones, expedientes y documentos generados deben estar encriptados tanto en tránsito (TLS) como en reposo (AES-256), cumpliendo con el secreto profesional.

---

## Arrancar

Requisitos: Node 20+, Java 17 y Docker Desktop. No hace falta instalar Maven: el backend trae el Maven Wrapper (`mvnw`).

La primera vez, instala las dependencias y crea el archivo de configuración del backend:

```bash
npm run setup
cp backend/.env.example backend/.env
```

### Base de datos

El backend lee la conexión de `backend/.env`. Ese archivo no se sube a git.

- **Local con Docker (por defecto):** deja `DB_URL` apuntando a `localhost`. `npm run dev` levanta PostgreSQL en Docker con el esquema y los datos semilla.
- **Neon:** pon en `DB_URL`, `DB_USERNAME` y `DB_PASSWORD` los datos del proyecto `lurifyCase` de Neon. La URL va en formato JDBC, por ejemplo `jdbc:postgresql://<host>-pooler.<región>.aws.neon.tech/neondb?sslmode=require&channelBinding=require`. Con una base remota, `npm run dev` no arranca Docker.

Pide los datos de Neon a quien administre el proyecto. Nunca los subas al repositorio.

### Comando de desarrollo

Después, un solo comando levanta todo:

```bash
npm run dev
```

Eso hace lo siguiente:

1. Si la base de datos es local, abre Docker Desktop si está apagado y levanta PostgreSQL. Si es Neon, se salta este paso.
2. Arranca el backend en `http://localhost:8080`.
3. Arranca Expo en `http://localhost:8081`. Desde ahí se abre la app en web (tecla `w`), en el emulador de Android (`a`) o en el teléfono con Expo Go escaneando el QR.

La app apunta al backend por la IP de tu red local, así que también funciona desde un teléfono conectado al mismo wifi. Para usar otra URL, define `EXPO_PUBLIC_API_URL` antes de ejecutar el comando.

`Ctrl+C` detiene el backend y la app. La base de datos sigue corriendo. Para apagarla:

```bash
npm run db:down
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Base de datos + backend + app |
| `npm run dev:api` | Solo el backend |
| `npm run dev:app` | Solo la app |
| `npm run db:up` / `npm run db:down` | Levanta o apaga PostgreSQL |

Usuario de prueba: `demo.lawyer@example.com` / `password123`.

## Documentación

### Backend

- [Arquitectura de la API REST y OpenAPI](backend/docs/API_ARCHITECTURE.md)
- [Contrato OpenAPI 3.1](backend/openapi.yaml)
- [JSON Schema del lienzo](backend/schemas/canvas.schema.json)
- [Esquema de base de datos](backend/database/schema.sql) y [datos semilla](backend/database/seed.sql)
- [Reporte de implementación de la base de datos](backend/database/IMPLEMENTATION_REPORT.md)
- [Plan de implementación del backend](backend/plan_backend.md)
- Diagramas: [clases](backend/docs/assets/diagrama-de-clases.png), [componentes](backend/docs/assets/diagrama-de-componentes.png), [secuencias](backend/docs/assets/diagrama-de-secuencias.png)

### Mobile

- [Guía para agentes de IA (Expo)](mobile/AGENTS.md)
- Diagramas: [secuencia de IA](<mobile/docs/diagrama de secuencia IA.png>), [modelo de datos](<mobile/docs/modelo de datos.png>)

## Historia

Este repo une `lurifyCase-backend` y `lurifyCase-mobile`. El historial de commits de ambos se conservó con `git subtree`, cada uno dentro de su carpeta.
