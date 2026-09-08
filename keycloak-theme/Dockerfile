# Stage 1: Build the Keycloak Theme using Node
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build the theme
COPY . .
RUN npm run build-keycloak-theme

# Stage 2: Create custom Keycloak image with the built theme baked in
FROM quay.io/keycloak/keycloak:24.0.0

# Copy the generated .jar file(s) into Keycloak's providers directory
COPY --from=builder /app/dist_keycloak/*.jar /opt/keycloak/providers/
