# Iurify Case

Monorepo de **Iurify Case**: gestión de expedientes y construcción de teorías del caso con IA.

| Carpeta | Contenido | Stack |
|---|---|---|
| [`backend/`](backend/) | API REST, base de datos, contrato OpenAPI | Java 17, Spring Boot, Maven, Docker Compose |
| [`mobile/`](mobile/) | App móvil | React Native, Expo, NativeWind |

## Arrancar

### Backend

```bash
cd backend
cp .env.example .env      # completar variables
docker compose up -d      # base de datos
mvn spring-boot:run
```

### Mobile

```bash
cd mobile
npm install
npm start                 # expo start
```

## Historia

Este repo une `lurifyCase-backend` y `lurifyCase-mobile`. El historial de commits de ambos se conservó con `git subtree`, cada uno dentro de su carpeta.
