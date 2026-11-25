FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY oism-backend/pom.xml oism-backend/pom.xml
COPY oism-database oism-database
WORKDIR /workspace/oism-backend
RUN mvn -q -DskipTests dependency:go-offline
COPY oism-backend/src src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/oism-backend/target/oism-backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
