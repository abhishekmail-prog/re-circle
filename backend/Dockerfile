# Stage 1: Build the application
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the jar, skipping tests to speed up deployment
RUN mvn clean package -DskipTests

# Stage 2: Run the application with a lightweight JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port (Render will override this with its $PORT variable)
EXPOSE 8080

# Run the application, binding to Render's dynamic PORT
CMD ["sh", "-c", "java -Dserver.port=$PORT -jar app.jar"]
