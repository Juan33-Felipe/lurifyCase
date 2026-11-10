# Etapa 1: Build
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copia dependencias y wrapper de maven
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copia código fuente y compila
COPY src ./src
RUN ./mvnw -DskipTests clean package

# Etapa 2: Runtime
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copia el JAR generado
COPY --from=build /app/target/iurifycase-backend-0.0.1-SNAPSHOT.jar app.jar

ENV SERVER_PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
