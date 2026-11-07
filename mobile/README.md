# Iurify Case - Mobile Frontend

Aplicación móvil **Iurify Case**, diseñada para la gestión de expedientes y la construcción de teorías del caso mediante interacción conversacional (voz/texto), renderización de lienzos visuales interactivos y asistencia de Inteligencia Artificial.

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
